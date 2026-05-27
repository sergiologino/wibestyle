package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.AdminUserEntity;
import ru.wibestyle.api.dto.AdminLoginRequest;
import ru.wibestyle.api.repository.AdminUserRepository;
import ru.wibestyle.api.service.AdminAuthService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final AdminUserRepository adminUserRepository;
    private final AdminProperties adminProperties;
    private final JwtService jwtService;

    public AdminAuthController(
            AdminAuthService adminAuthService,
            AdminUserRepository adminUserRepository,
            AdminProperties adminProperties,
            JwtService jwtService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminUserRepository = adminUserRepository;
        this.adminProperties = adminProperties;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AdminLoginRequest request) {
        try {
            return adminAuthService.login(
                    request.email(),
                    request.password(),
                    request.captchaId(),
                    request.captchaAnswer()
            );
        } catch (IllegalArgumentException ex) {
            HttpStatus status = "ADMIN_LOGIN_FAILED".equals(ex.getMessage()) ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }
    }

    @GetMapping("/me")
    public Map<String, Object> me(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            AdminSupport.AdminActor actor = AdminSupport.resolve(adminKey, authorization, adminProperties, jwtService, adminUserRepository);
            if ("api-key".equals(actor.source())) {
                return Map.of(
                        "id", "api-key",
                        "email", "api-key@system",
                        "displayName", "API Key Admin",
                        "role", actor.role().name(),
                        "permissions", Map.of(
                                "manageUsers", true,
                                "impersonate", true,
                                "moderateContent", true
                        )
                );
            }
            AdminUserEntity admin = adminUserRepository.findById(UUID.fromString(actor.id()))
                    .orElseThrow(() -> new IllegalArgumentException("ADMIN_UNAUTHORIZED"));
            return adminAuthService.me(admin);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
        }
    }
}
