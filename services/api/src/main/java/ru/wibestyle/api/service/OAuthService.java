package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import ru.wibestyle.api.config.OAuthProperties;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.domain.UserOAuthIdentityEntity;
import ru.wibestyle.api.repository.UserOAuthIdentityRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OAuthService {

    private final OAuthProperties oauthProperties;
    private final UserRepository userRepository;
    private final UserOAuthIdentityRepository userOAuthIdentityRepository;
    private final ProfileService profileService;
    private final TokenIssuanceService tokenIssuanceService;
    private final PlatformSettingsService platformSettingsService;
    private final GeoIpService geoIpService;
    private final ReferralService referralService;
    private final Map<String, OAuthState> states = new ConcurrentHashMap<>();

    public OAuthService(
            OAuthProperties oauthProperties,
            UserRepository userRepository,
            UserOAuthIdentityRepository userOAuthIdentityRepository,
            ProfileService profileService,
            TokenIssuanceService tokenIssuanceService,
            PlatformSettingsService platformSettingsService,
            GeoIpService geoIpService,
            ReferralService referralService
    ) {
        this.oauthProperties = oauthProperties;
        this.userRepository = userRepository;
        this.userOAuthIdentityRepository = userOAuthIdentityRepository;
        this.profileService = profileService;
        this.tokenIssuanceService = tokenIssuanceService;
        this.platformSettingsService = platformSettingsService;
        this.geoIpService = geoIpService;
        this.referralService = referralService;
    }

    public Map<String, Object> providerStatus(HttpServletRequest request) {
        return Map.of(
                "yandex", Map.of("enabled", oauthProperties.getYandex().isConfigured()),
                "google", Map.of("enabled", isGoogleVisible(request))
        );
    }

    public Map<String, Object> start(String provider, String returnUrl, HttpServletRequest request) {
        return start(provider, returnUrl, null, request);
    }

    public Map<String, Object> start(String provider, String returnUrl, String referralCode, HttpServletRequest request) {
        if ("google".equalsIgnoreCase(provider) && !isGoogleVisible(request)) {
            throw new IllegalArgumentException("OAUTH_PROVIDER_DISABLED");
        }
        OAuthProperties.Provider config = providerConfig(provider);
        if (!config.isConfigured()) {
            throw new IllegalArgumentException("OAUTH_PROVIDER_DISABLED");
        }
        String state = UUID.randomUUID().toString();
        String redirectTarget = normalizeReturnUrl(returnUrl);
        states.put(state, new OAuthState(Instant.now().plusSeconds(600), redirectTarget, referralCode));
        String redirectUri = callbackUri(provider);
        String authorizationUrl = switch (provider.toLowerCase()) {
            case "yandex" -> UriComponentsBuilder
                    .fromUriString("https://oauth.yandex.ru/authorize")
                    .queryParam("response_type", "code")
                    .queryParam("client_id", config.getClientId())
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("state", state)
                    .build(true)
                    .toUriString();
            case "google" -> UriComponentsBuilder
                    .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                    .queryParam("response_type", "code")
                    .queryParam("client_id", config.getClientId())
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("scope", "openid email profile")
                    .queryParam("state", state)
                    .queryParam("access_type", "online")
                    .build(true)
                    .toUriString();
            default -> throw new IllegalArgumentException("OAUTH_PROVIDER_UNSUPPORTED");
        };
        return Map.of("provider", provider, "authorizationUrl", authorizationUrl, "state", state);
    }

    @Transactional
    public URI completeCallback(String provider, String code, String state) {
        if (code == null || code.isBlank() || state == null || state.isBlank()) {
            throw new IllegalArgumentException("OAUTH_CALLBACK_INVALID");
        }
        OAuthState oauthState = states.remove(state);
        if (oauthState == null || oauthState.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("OAUTH_STATE_EXPIRED");
        }
        OAuthProfile profile = fetchProfile(provider, code);
        boolean isNewUser;
        UserEntity user = userOAuthIdentityRepository
                .findByProviderAndProviderUserId(provider, profile.providerUserId())
                .flatMap(identity -> userRepository.findById(identity.getUserId()))
                .orElse(null);
        if (user == null && profile.email() != null) {
            user = userRepository.findByEmailIgnoreCase(profile.email()).orElse(null);
        }
        if (user == null) {
            isNewUser = true;
            user = userRepository.save(UserEntity.createWithOAuth(
                    UUID.randomUUID(),
                    profile.email(),
                    provider,
                    Instant.now()
            ));
            profileService.ensureProfile(user.getId());
            referralService.captureNewUser(user.getId(), oauthState.referralCode());
            userOAuthIdentityRepository.save(new UserOAuthIdentityEntity(
                    UUID.randomUUID(),
                    user.getId(),
                    provider,
                    profile.providerUserId(),
                    profile.email(),
                    Instant.now()
            ));
        } else {
            isNewUser = false;
            if (profile.email() != null && user.getEmail() == null) {
                user.setEmail(profile.email());
                userRepository.save(user);
            }
            if (userOAuthIdentityRepository.findByProviderAndProviderUserId(provider, profile.providerUserId()).isEmpty()) {
                userOAuthIdentityRepository.save(new UserOAuthIdentityEntity(
                        UUID.randomUUID(),
                        user.getId(),
                        provider,
                        profile.providerUserId(),
                        profile.email(),
                        Instant.now()
                ));
            }
        }
        Map<String, Object> tokens = tokenIssuanceService.issueUserTokens(user, isNewUser, Map.of("redeemed", false));
        return UriComponentsBuilder.fromUriString(oauthState.returnUrl())
                .queryParam("accessToken", tokens.get("accessToken"))
                .queryParam("refreshToken", tokens.get("refreshToken"))
                .queryParam("newUser", String.valueOf(tokens.get("newUser")))
                .build(true)
                .toUri();
    }

    public boolean isGoogleVisible(HttpServletRequest request) {
        if (!oauthProperties.getGoogle().isConfigured()) {
            return false;
        }
        if (platformSettingsService.isBlockGoogleOAuth()) {
            return false;
        }
        if (geoIpService.isRussian(request)) {
            return false;
        }
        return true;
    }

    private OAuthProfile fetchProfile(String provider, String code) {
        OAuthProperties.Provider config = providerConfig(provider);
        String redirectUri = callbackUri(provider);
        return switch (provider.toLowerCase()) {
            case "yandex" -> fetchYandexProfile(config, code, redirectUri);
            case "google" -> fetchGoogleProfile(config, code, redirectUri);
            default -> throw new IllegalArgumentException("OAUTH_PROVIDER_UNSUPPORTED");
        };
    }

    private OAuthProfile fetchYandexProfile(OAuthProperties.Provider config, String code, String redirectUri) {
        JsonNode token = postForm(
                "https://oauth.yandex.ru/token",
                "grant_type=authorization_code"
                        + "&code=" + encode(code)
                        + "&client_id=" + encode(config.getClientId())
                        + "&client_secret=" + encode(config.getClientSecret())
        );
        String accessToken = token.path("access_token").asText(null);
        if (accessToken == null) {
            throw new IllegalArgumentException("OAUTH_TOKEN_FAILED");
        }
        JsonNode info = getJson("https://login.yandex.ru/info?format=json", accessToken);
        return new OAuthProfile(
                info.path("id").asText(),
                info.path("default_email").asText(null),
                info.path("display_name").asText(null)
        );
    }

    private OAuthProfile fetchGoogleProfile(OAuthProperties.Provider config, String code, String redirectUri) {
        JsonNode token = postForm(
                "https://oauth2.googleapis.com/token",
                "grant_type=authorization_code"
                        + "&code=" + encode(code)
                        + "&client_id=" + encode(config.getClientId())
                        + "&client_secret=" + encode(config.getClientSecret())
                        + "&redirect_uri=" + encode(redirectUri)
        );
        String accessToken = token.path("access_token").asText(null);
        if (accessToken == null) {
            throw new IllegalArgumentException("OAUTH_TOKEN_FAILED");
        }
        JsonNode info = getJson("https://www.googleapis.com/oauth2/v3/userinfo", accessToken);
        return new OAuthProfile(
                info.path("sub").asText(),
                info.path("email").asText(null),
                info.path("name").asText(null)
        );
    }

    private JsonNode postForm(String url, String body) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readTree(
                    java.net.http.HttpClient.newHttpClient().send(
                            java.net.http.HttpRequest.newBuilder(URI.create(url))
                                    .header("Content-Type", "application/x-www-form-urlencoded")
                                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body))
                                    .build(),
                            java.net.http.HttpResponse.BodyHandlers.ofString()
                    ).body()
            );
        } catch (Exception ex) {
            throw new IllegalArgumentException("OAUTH_TOKEN_FAILED", ex);
        }
    }

    private JsonNode getJson(String url, String bearerToken) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readTree(
                    java.net.http.HttpClient.newHttpClient().send(
                            java.net.http.HttpRequest.newBuilder(URI.create(url))
                                    .header("Authorization", "Bearer " + bearerToken)
                                    .GET()
                                    .build(),
                            java.net.http.HttpResponse.BodyHandlers.ofString()
                    ).body()
            );
        } catch (Exception ex) {
            throw new IllegalArgumentException("OAUTH_PROFILE_FAILED", ex);
        }
    }

    private OAuthProperties.Provider providerConfig(String provider) {
        return switch (provider.toLowerCase()) {
            case "yandex" -> oauthProperties.getYandex();
            case "google" -> oauthProperties.getGoogle();
            default -> throw new IllegalArgumentException("OAUTH_PROVIDER_UNSUPPORTED");
        };
    }

    private String callbackUri(String provider) {
        return oauthProperties.getApiPublicBaseUrl().replaceAll("/$", "")
                + "/api/v1/auth/oauth/" + provider.toLowerCase() + "/callback";
    }

    private String normalizeReturnUrl(String returnUrl) {
        if (returnUrl == null || returnUrl.isBlank()) {
            return oauthProperties.getWebAppCallbackUrl();
        }
        String trimmed = returnUrl.trim();
        if (trimmed.startsWith(oauthProperties.getWebAppCallbackUrl())
                || trimmed.startsWith(oauthProperties.getMobileAppCallbackUrl())
                || trimmed.startsWith("wibestyle://")) {
            return trimmed;
        }
        throw new IllegalArgumentException("OAUTH_RETURN_URL_INVALID");
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record OAuthState(Instant expiresAt, String returnUrl, String referralCode) {
    }

    private record OAuthProfile(String providerUserId, String email, String displayName) {
    }
}
