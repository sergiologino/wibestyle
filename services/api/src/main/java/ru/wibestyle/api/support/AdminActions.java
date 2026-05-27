package ru.wibestyle.api.support;

import jakarta.servlet.http.HttpServletRequest;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.service.AdminAuditService;

public final class AdminActions {

    private AdminActions() {
    }

    public static void audit(
            AdminAuditService auditService,
            String adminKey,
            AdminProperties adminProperties,
            HttpServletRequest request,
            String action,
            String entityType,
            String entityId,
            String details
    ) {
        if (adminKey != null && adminKey.equals(adminProperties.getApiKey())) {
            auditService.record("admin", action, entityType, entityId, RequestSupport.clientIp(request), details);
        }
    }
}
