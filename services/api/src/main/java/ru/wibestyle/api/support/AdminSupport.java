package ru.wibestyle.api.support;

import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.AdminRole;
import ru.wibestyle.api.domain.AdminUserEntity;
import ru.wibestyle.api.repository.AdminUserRepository;

import java.util.UUID;

public final class AdminSupport {

    private AdminSupport() {
    }

    public record AdminActor(String id, AdminRole role, String source) {
    }

    public static AdminActor resolve(
            String adminKeyHeader,
            String authorizationHeader,
            AdminProperties adminProperties,
            JwtService jwtService,
            AdminUserRepository adminUserRepository
    ) {
        if (adminKeyHeader != null && !adminKeyHeader.isBlank() && adminKeyHeader.equals(adminProperties.getApiKey())) {
            return new AdminActor("api-key", AdminRole.SUPER_ADMIN, "api-key");
        }
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring("Bearer ".length()).trim();
            if (jwtService.isAdminToken(token)) {
                UUID adminId = jwtService.parseAdminUserId(token);
                AdminUserEntity admin = adminUserRepository.findById(adminId)
                        .orElseThrow(() -> new IllegalArgumentException("ADMIN_UNAUTHORIZED"));
                if (!admin.isActive()) {
                    throw new IllegalArgumentException("ADMIN_UNAUTHORIZED");
                }
                String roleClaim = jwtService.parseAdminRole(token);
                AdminRole role = roleClaim != null ? AdminRole.parse(roleClaim) : admin.getRole();
                return new AdminActor(admin.getId().toString(), role, "jwt");
            }
        }
        throw new IllegalArgumentException("ADMIN_UNAUTHORIZED");
    }

    public static void requireRole(AdminActor actor, java.util.function.Predicate<AdminRole> permission) {
        if (!permission.test(actor.role())) {
            throw new IllegalArgumentException("ADMIN_FORBIDDEN");
        }
    }

    @Deprecated
    public static void requireAdminKey(String header, AdminProperties adminProperties) {
        if (header == null || header.isBlank() || !header.equals(adminProperties.getApiKey())) {
            throw new IllegalArgumentException("ADMIN_UNAUTHORIZED");
        }
    }
}
