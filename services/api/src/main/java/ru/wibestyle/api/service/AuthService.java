package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.config.SmsProperties;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.support.OtpCodeGenerator;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final PromoService promoService;
    private final ReferralService referralService;
    private final MarketingAttributionService marketingAttributionService;
    private final DeviceTrustService deviceTrustService;
    private final JwtService jwtService;
    private final RefreshTokenStore refreshTokenStore;
    private final AuthProperties authProperties;
    private final SmsProperties smsProperties;
    private final SmsSender smsSender;
    private final EmailSender emailSender;
    private final TransactionTemplate transactionTemplate;
    private final Map<String, PhoneOtpChallenge> phoneChallenges = new ConcurrentHashMap<>();
    private final Map<String, EmailOtpChallenge> emailChallenges = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastStartByPhone = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastStartByEmail = new ConcurrentHashMap<>();
    public AuthService(
            UserRepository userRepository,
            ProfileService profileService,
            PromoService promoService,
            ReferralService referralService,
            MarketingAttributionService marketingAttributionService,
            DeviceTrustService deviceTrustService,
            JwtService jwtService,
            RefreshTokenStore refreshTokenStore,
            AuthProperties authProperties,
            SmsProperties smsProperties,
            SmsSender smsSender,
            EmailSender emailSender,
            PlatformTransactionManager transactionManager
    ) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.promoService = promoService;
        this.referralService = referralService;
        this.marketingAttributionService = marketingAttributionService;
        this.deviceTrustService = deviceTrustService;
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.authProperties = authProperties;
        this.smsProperties = smsProperties;
        this.smsSender = smsSender;
        this.emailSender = emailSender;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public OtpStartResult startOtp(String phone) {
        String normalized = normalizePhone(phone);
        String digits = phoneDigits(normalized);
        if (digits.length() < 10 || digits.length() > 15) {
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
        return new OtpStartResult(
                requestId,
                authProperties.getOtpTtlSeconds(),
                authProperties.getOtpResendCooldownSeconds()
        );
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
        return new OtpStartResult(
                requestId,
                authProperties.getOtpTtlSeconds(),
                authProperties.getOtpResendCooldownSeconds()
        );
    }

    public AuthResult verifyOtp(String requestId, String code, String promoCode) {
        return verifyOtp(requestId, code, promoCode, null);
    }

    public AuthResult verifyOtp(String requestId, String code, String promoCode, String referralCode) {
        return verifyOtp(requestId, code, promoCode, referralCode, null);
    }

    public AuthResult verifyOtp(String requestId, String code, String promoCode, String referralCode, String visitorId) {
        return verifyOtp(requestId, code, promoCode, referralCode, visitorId, null);
    }

    public AuthResult verifyOtp(
            String requestId,
            String code,
            String promoCode,
            String referralCode,
            String visitorId,
            String deviceId
    ) {
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

        return authenticateVerifiedPhone(challenge.phone(), promoCode, referralCode, visitorId, deviceId);
    }

    public AuthResult authenticateVerifiedPhone(
            String phone,
            String promoCode,
            String referralCode,
            String visitorId,
            String deviceId
    ) {
        String normalizedPhone = normalizePhone(phone);
        String digits = phoneDigits(normalizedPhone);
        if (digits.length() < 10 || digits.length() > 15) {
            throw new IllegalArgumentException("INVALID_PHONE");
        }
        Object lock = normalizedPhone.intern();
        synchronized (lock) {
            return transactionTemplate.execute(status ->
                    authenticateVerifiedPhoneInTransaction(normalizedPhone, promoCode, referralCode, visitorId, deviceId)
            );
        }
    }

    private AuthResult authenticateVerifiedPhoneInTransaction(
            String normalizedPhone,
            String promoCode,
            String referralCode,
            String visitorId,
            String deviceId
    ) {
        UserEntity user = findUserByPhoneForLogin(normalizedPhone)
                .orElse(null);
        boolean isNewUser = user == null;
        if (user == null) {
            user = userRepository.saveAndFlush(new UserEntity(UUID.randomUUID(), normalizedPhone, Instant.now()));
        }
        profileService.ensureProfile(user.getId());
        if (isNewUser) referralService.captureNewUser(user.getId(), referralCode);
        try {
            marketingAttributionService.attachUserToVisitor(user.getId(), visitorId, isNewUser);
        } catch (RuntimeException ex) {
            log.warn("Marketing attribution did not attach during SMS authentication", ex);
        }
        DeviceTrustService.DeviceRegistrationResult deviceResult =
                deviceTrustService.recordAuthentication(user.getId(), deviceId, isNewUser);

        Map<String, Object> promoResult = Map.of("redeemed", false);
        if (promoCode != null && !promoCode.isBlank()) {
            promoResult = promoService.redeemForUser(user.getId(), promoCode);
        }

        return issueTokens(user, isNewUser, promoResult, deviceResult);
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
        if (isNewUser) referralService.ensureAccountForUser(user.getId());

        Map<String, Object> promoResult = Map.of("redeemed", false);
        if (promoCode != null && !promoCode.isBlank()) {
            promoResult = promoService.redeemForUser(user.getId(), promoCode);
        }

        return issueTokens(user, isNewUser, promoResult, DeviceTrustService.DeviceRegistrationResult.empty());
    }

    public AuthResult refresh(String refreshToken) {
        UUID userId = refreshTokenStore.consume(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("REFRESH_TOKEN_INVALID"));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        return issueTokens(user, false, Map.of("redeemed", false), DeviceTrustService.DeviceRegistrationResult.empty());
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenStore.revoke(refreshToken);
        }
    }

    private AuthResult issueTokens(
            UserEntity user,
            boolean newUser,
            Map<String, Object> promoResult,
            DeviceTrustService.DeviceRegistrationResult deviceResult
    ) {
        String accessToken = jwtService.createAccessToken(user.getId());
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.save(refreshToken, user.getId(), authProperties.getRefreshTokenTtlSeconds());
        return new AuthResult(
                accessToken,
                refreshToken,
                jwtService.accessTokenTtlSeconds(),
                user,
                newUser,
                promoResult,
                deviceResult
        );
    }

    private String nextOtpCode(int length) {
        if (authProperties.hasOtpDevFixedCode()) {
            return authProperties.getOtpDevFixedCode();
        }
        return OtpCodeGenerator.generateNumericCode(length);
    }

    private String normalizePhone(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        return digits.isBlank() ? "" : "+" + digits;
    }

    private Optional<UserEntity> findUserByPhoneForLogin(String normalizedPhone) {
        String digits = phoneDigits(normalizedPhone);
        if (digits.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findPhoneLoginCandidates(normalizedPhone, digits, PageRequest.of(0, 1))
                .stream()
                .findFirst();
    }

    private String phoneDigits(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D", "");
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

    public record OtpStartResult(String requestId, int expiresIn, int resendIn) {
    }

    public record AuthResult(
            String accessToken,
            String refreshToken,
            int expiresIn,
            UserEntity user,
            boolean newUser,
            Map<String, Object> promo,
            DeviceTrustService.DeviceRegistrationResult device
    ) {
    }
}
