package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.AdminSubscriptionPatchRequest;
import ru.wibestyle.api.repository.AdminUserRepository;
import ru.wibestyle.api.service.AdminAuditService;
import ru.wibestyle.api.service.AdminUserManagementService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserManagementService adminUserManagementService;
    private final AdminAuditService adminAuditService;
    private final AdminProperties adminProperties;
    private final AdminUserRepository adminUserRepository;
    private final JwtService jwtService;

    public AdminUserController(
            AdminUserManagementService adminUserManagementService,
            AdminAuditService adminAuditService,
            AdminProperties adminProperties,
            AdminUserRepository adminUserRepository,
            JwtService jwtService
    ) {
        this.adminUserManagementService = adminUserManagementService;
        this.adminAuditService = adminAuditService;
        this.adminProperties = adminProperties;
        this.adminUserRepository = adminUserRepository;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireManageUsers(adminKey, authorization);
        return adminUserManagementService.listUsers();
    }

    @PatchMapping("/{userId}/subscription")
    public Map<String, Object> updateSubscription(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @Valid @RequestBody AdminSubscriptionPatchRequest request
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserManagementService.updateSubscription(
                    userId,
                    new AdminUserManagementService.AdminSubscriptionUpdateRequest(
                            request.plan(),
                            request.trialGenerationsLeft(),
                            request.planGenerationsLeft(),
                            request.billingPeriod(),
                            request.subscriptionExpiresAt()
                    )
            );
            adminAuditService.record(actor.id(), "subscription_override", "user", userId.toString(), null, request.plan());
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/{userId}/impersonate")
    public Map<String, Object> impersonate(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        AdminSupport.requireRole(actor, role -> role.canImpersonate());
        try {
            Map<String, Object> result = adminUserManagementService.impersonate(userId);
            adminAuditService.record(actor.id(), "impersonate", "user", userId.toString(), null, null);
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/{userId}")
    public Map<String, Object> deleteUser(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserManagementService.deleteUser(userId);
            adminAuditService.record(actor.id(), "delete_user", "user", userId.toString(), null, null);
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    private AdminSupport.AdminActor requireManageUsers(String adminKey, String authorization) {
        try {
            AdminSupport.AdminActor actor = AdminSupport.resolve(adminKey, authorization, adminProperties, jwtService, adminUserRepository);
            AdminSupport.requireRole(actor, role -> role.canManageUsers());
            return actor;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    "ADMIN_FORBIDDEN".equals(ex.getMessage()) ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED,
                    ex.getMessage(),
                    ex
            );
        }
    }
}
