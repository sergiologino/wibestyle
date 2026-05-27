package ru.wibestyle.api.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.UserRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class PasswordAuthService {

    private static final Pattern LOGIN_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]{3,32}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-zА-Яа-я])(?=.*\\d).{8,72}$");

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final PasswordEncoder passwordEncoder;
    private final CaptchaService captchaService;
    private final TokenIssuanceService tokenIssuanceService;

    public PasswordAuthService(
            UserRepository userRepository,
            ProfileService profileService,
            PasswordEncoder passwordEncoder,
            CaptchaService captchaService,
            TokenIssuanceService tokenIssuanceService
    ) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.passwordEncoder = passwordEncoder;
        this.captchaService = captchaService;
        this.tokenIssuanceService = tokenIssuanceService;
    }

    @Transactional
    public Map<String, Object> register(
            String login,
            String email,
            String password,
            String captchaId,
            String captchaAnswer,
            String displayName
    ) {
        captchaService.verify(captchaId, captchaAnswer);
        String normalizedLogin = normalizeLogin(login);
        validatePassword(password);
        if (userRepository.findByLoginIgnoreCase(normalizedLogin).isPresent()) {
            throw new IllegalArgumentException("LOGIN_ALREADY_EXISTS");
        }
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail != null && userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("EMAIL_ALREADY_EXISTS");
        }

        Instant now = Instant.now();
        UserEntity user = UserEntity.createWithPassword(
                UUID.randomUUID(),
                normalizedLogin,
                normalizedEmail,
                passwordEncoder.encode(password),
                now
        );
        userRepository.save(user);
        profileService.ensureProfile(user.getId());
        if (displayName != null && !displayName.isBlank()) {
            profileService.updateProfile(user.getId(), new ru.wibestyle.api.dto.UpdateProfileRequest(
                    displayName.trim(), null, null, null, null, null, null, null, null, null, null, null, null, null
            ));
        }
        return tokenIssuanceService.issueUserTokens(user, true, Map.of("redeemed", false));
    }

    @Transactional
    public Map<String, Object> login(String identifier, String password, String captchaId, String captchaAnswer) {
        captchaService.verify(captchaId, captchaAnswer);
        UserEntity user = findByIdentifier(identifier)
                .orElseThrow(() -> new IllegalArgumentException("LOGIN_FAILED"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("LOGIN_FAILED");
        }
        return tokenIssuanceService.issueUserTokens(user, false, Map.of("redeemed", false));
    }

    private java.util.Optional<UserEntity> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return java.util.Optional.empty();
        }
        String trimmed = identifier.trim();
        if (trimmed.contains("@")) {
            return userRepository.findByEmailIgnoreCase(trimmed.toLowerCase());
        }
        return userRepository.findByLoginIgnoreCase(trimmed);
    }

    private static String normalizeLogin(String login) {
        if (login == null || login.isBlank()) {
            throw new IllegalArgumentException("LOGIN_INVALID");
        }
        String normalized = login.trim().toLowerCase();
        if (!LOGIN_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("LOGIN_INVALID");
        }
        return normalized;
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        String normalized = email.trim().toLowerCase();
        if (!normalized.contains("@") || normalized.length() > 255) {
            throw new IllegalArgumentException("EMAIL_INVALID");
        }
        return normalized;
    }

    private static void validatePassword(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("PASSWORD_WEAK");
        }
    }
}
