package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.config.SmsProperties;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.support.OtpCodeGenerator;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final PromoService promoService;
    private final JwtService jwtService;
    private final RefreshTokenStore refreshTokenStore;
    private final AuthProperties authProperties;
    private final SmsProperties smsProperties;
    private final SmsSender smsSender;
    private final EmailSender emailSender;
    private final Map<String, PhoneOtpChallenge> phoneChallenges = new ConcurrentHashMap<>();
    private final Map<String, EmailOtpChallenge> emailChallenges = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastStartByPhone = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastStartByEmail = new ConcurrentHashMap<>();

    public AuthService(
            UserRepository userRepository,
            ProfileService profileService,
            PromoService promoService,
            JwtService jwtService,
            RefreshTokenStore refreshTokenStore,
            AuthProperties authProperties,
            SmsProperties smsProperties,
            SmsSender smsSender,
            EmailSender emailSender
    ) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.promoService = promoService;
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.authProperties = authProperties;
        this.smsProperties = smsProperties;
        this.smsSender = smsSender;
        this.emailSender = emailSender;
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

        String code = smsProperties.isConfigured() ? nextOtpCode(6) : smsProperties.getDevStubCode();
        String requestId = UUID.randomUUID().toString();
        phoneChallenges.put(requestId, new PhoneOtpChallenge(normalized, code, now.plusSeconds(authProperties.getOtpTtlSeconds()), 0));
        lastStartByPhone.put(normalized, now);
        try {
            smsSender.sendOtpCode(normalized, code);
        } catch (RuntimeException ex) {
            phoneChallenges.remove(requestId);
            lastStartByPhone.remove(normalized, now);
            throw ex;
        }
        return new OtpStartResult(requestId, authProperties.getOtpTtlSeconds());
    }

    public OtpStartResult startEmailOtp(String email) {
        String normalized = normalizeEmail(email);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("INVALID_EMAIL");
        }

        Instant now = Instant.now();
        Instant lastStart = lastStartByEmail.get(normalized);
        if (lastStart != null && lastStart.plusSeconds(authProperties.getOtpResendCooldownSeconds()).isAfter(now)) {
            throw new IllegalArgumentException("OTP_RESEND_COOLDOWN");
        }

        String code = nextOtpCode(6);
        String requestId = UUID.randomUUID().toString();
        emailChallenges.put(requestId, new EmailOtpChallenge(normalized, code, now.plusSeconds(authProperties.getOtpTtlSeconds()), 0));
        lastStartByEmail.put(normalized, now);
        emailSender.sendOtpCode(normalized, code);
        return new OtpStartResult(requestId, authProperties.getOtpTtlSeconds());
    }

    @Transactional
    public AuthResult verifyOtp(String requestId, String code, String promoCode) {
        PhoneOtpChallenge challenge = phoneChallenges.get(requestId);
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            phoneChallenges.remove(requestId);
            throw new IllegalArgumentException("OTP_EXPIRED");
        }
        if (challenge.attempts() >= authProperties.getOtpMaxAttempts()) {
            phoneChallenges.remove(requestId);
            throw new IllegalArgumentException("OTP_MAX_ATTEMPTS");
        }
        if (!challenge.code().equals(code)) {
            phoneChallenges.put(requestId, challenge.withAttempts(challenge.attempts() + 1));
            throw new IllegalArgumentException("OTP_INVALID");
        }
        phoneChallenges.remove(requestId);

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

    @Transactional
    public AuthResult verifyEmailOtp(String requestId, String code, String promoCode) {
        EmailOtpChallenge challenge = emailChallenges.get(requestId);
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            emailChallenges.remove(requestId);
            throw new IllegalArgumentException("OTP_EXPIRED");
        }
        if (challenge.attempts() >= authProperties.getOtpMaxAttempts()) {
            emailChallenges.remove(requestId);
            throw new IllegalArgumentException("OTP_MAX_ATTEMPTS");
        }
        if (!challenge.code().equals(code)) {
            emailChallenges.put(requestId, challenge.withAttempts(challenge.attempts() + 1));
            throw new IllegalArgumentException("OTP_INVALID");
        }
        emailChallenges.remove(requestId);

        boolean isNewUser = userRepository.findByEmailIgnoreCase(challenge.email()).isEmpty();
        UserEntity user = userRepository.findByEmailIgnoreCase(challenge.email())
                .orElseGet(() -> userRepository.saveAndFlush(UserEntity.createWithEmail(UUID.randomUUID(), challenge.email(), Instant.now())));
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

    private String nextOtpCode(int length) {
        if (authProperties.hasOtpDevFixedCode()) {
            return authProperties.getOtpDevFixedCode();
        }
        return OtpCodeGenerator.generateNumericCode(length);
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9+]", "");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private record PhoneOtpChallenge(String phone, String code, Instant expiresAt, int attempts) {
        PhoneOtpChallenge withAttempts(int nextAttempts) {
            return new PhoneOtpChallenge(phone, code, expiresAt, nextAttempts);
        }
    }

    private record EmailOtpChallenge(String email, String code, Instant expiresAt, int attempts) {
        EmailOtpChallenge withAttempts(int nextAttempts) {
            return new EmailOtpChallenge(email, code, expiresAt, nextAttempts);
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
