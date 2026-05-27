package ru.wibestyle.api.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.domain.AdminRole;
import ru.wibestyle.api.domain.AdminUserEntity;
import ru.wibestyle.api.repository.AdminUserRepository;

import java.util.HashMap;
import java.util.Map;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final CaptchaService captchaService;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            CaptchaService captchaService
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
        this.captchaService = captchaService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> login(String email, String password, String captchaId, String captchaAnswer) {
        captchaService.verify(captchaId, captchaAnswer);
        AdminUserEntity admin = adminUserRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("ADMIN_LOGIN_FAILED"));
        if (!admin.isActive() || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            throw new IllegalArgumentException("ADMIN_LOGIN_FAILED");
        }
        String accessToken = jwtService.createAdminAccessToken(
                admin.getId(),
                admin.getRole().name(),
                authProperties.getAccessTokenTtlSeconds()
        );
        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("tokenType", "Bearer");
        response.put("expiresIn", authProperties.getAccessTokenTtlSeconds());
        response.put("admin", Map.of(
                "id", admin.getId().toString(),
                "email", admin.getEmail(),
                "displayName", admin.getDisplayName() == null ? admin.getEmail() : admin.getDisplayName(),
                "role", admin.getRole().name()
        ));
        return response;
    }

    public Map<String, Object> me(AdminUserEntity admin) {
        return Map.of(
                "id", admin.getId().toString(),
                "email", admin.getEmail(),
                "displayName", admin.getDisplayName() == null ? admin.getEmail() : admin.getDisplayName(),
                "role", admin.getRole().name(),
                "permissions", Map.of(
                        "manageUsers", admin.getRole().canManageUsers(),
                        "impersonate", admin.getRole().canImpersonate(),
                        "moderateContent", admin.getRole().canModerateContent()
                )
        );
    }
}
