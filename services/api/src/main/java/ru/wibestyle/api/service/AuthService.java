package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.UserRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final PromoService promoService;
    private final JwtService jwtService;
    private final RefreshTokenStore refreshTokenStore;
    private final AuthProperties authProperties;
    private final Map<String, OtpChallenge> challenges = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastStartByPhone = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository userRepository,
            ProfileService profileService,
            PromoService promoService,
            JwtService jwtService,
            RefreshTokenStore refreshTokenStore,
            AuthProperties authProperties
    ) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.promoService = promoService;
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.authProperties = authProperties;
    }

    public OtpStartResult startOtp(String phone) {
        String normalized = normalizePhone(phone);
        if (normalized.length() < 10) {
            throw new IllegalArgumentException("INVALID_PHONE");
        }

        Instant now = Instant.now();
        Instant lastStart = lastStartByPhone.get(normalized);
        if (lastStart != null && lastStart.plusSeconds(authProperties.getOtpResendCooldownSeconds()).isAfter(now)) {
            throw new IllegalArgumentException("OTP_RESEND_COOLDOWN");
        }

        String requestId = UUID.randomUUID().toString();
        String code = "0000";
        challenges.put(requestId, new OtpChallenge(normalized, code, now.plusSeconds(authProperties.getOtpTtlSeconds()), 0));
        lastStartByPhone.put(normalized, now);
        return new OtpStartResult(requestId, authProperties.getOtpTtlSeconds());
    }

    @Transactional
    public AuthResult verifyOtp(String requestId, String code, String promoCode) {
        OtpChallenge challenge = challenges.get(requestId);
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            challenges.remove(requestId);
            throw new IllegalArgumentException("OTP_EXPIRED");
        }
        if (challenge.attempts() >= authProperties.getOtpMaxAttempts()) {
            challenges.remove(requestId);
            throw new IllegalArgumentException("OTP_MAX_ATTEMPTS");
        }
        if (!challenge.code().equals(code)) {
            challenges.put(requestId, challenge.withAttempts(challenge.attempts() + 1));
            throw new IllegalArgumentException("OTP_INVALID");
        }
        challenges.remove(requestId);

        boolean isNewUser = userRepository.findByPhone(challenge.phone()).isEmpty();
        UserEntity user = userRepository.findByPhone(challenge.phone())
                .orElseGet(() -> userRepository.saveAndFlush(new UserEntity(UUID.randomUUID(), challenge.phone(), Instant.now())));
        profileService.ensureProfile(user.getId());

        Map<String, Object> promoResult = Map.of("redeemed", false);
        if (promoCode != null && !promoCode.isBlank()) {
            promoResult = promoService.redeemForUser(user.getId(), promoCode);
        }

        return issueTokens(user, isNewUser, promoResult);
    }

    public AuthResult refresh(String refreshToken) {
        UUID userId = refreshTokenStore.consume(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("REFRESH_TOKEN_INVALID"));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        return issueTokens(user, false, Map.of("redeemed", false));
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenStore.revoke(refreshToken);
        }
    }

    private AuthResult issueTokens(UserEntity user, boolean newUser, Map<String, Object> promoResult) {
        String accessToken = jwtService.createAccessToken(user.getId());
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.save(refreshToken, user.getId(), authProperties.getRefreshTokenTtlSeconds());
        return new AuthResult(
                accessToken,
                refreshToken,
                jwtService.accessTokenTtlSeconds(),
                user,
                newUser,
                promoResult
        );
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9+]", "");
    }

    private record OtpChallenge(String phone, String code, Instant expiresAt, int attempts) {
        OtpChallenge withAttempts(int nextAttempts) {
            return new OtpChallenge(phone, code, expiresAt, nextAttempts);
        }
    }

    public record OtpStartResult(String requestId, int expiresIn) {
    }

    public record AuthResult(
            String accessToken,
            String refreshToken,
            int expiresIn,
            UserEntity user,
            boolean newUser,
            Map<String, Object> promo
    ) {
    }
}
