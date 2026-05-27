package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.service.AdminAuditService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AdminAuditController {

    private final AdminAuditService adminAuditService;
    private final AdminProperties adminProperties;

    public AdminAuditController(AdminAuditService adminAuditService, AdminProperties adminProperties) {
        this.adminAuditService = adminAuditService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return adminAuditService.listRecent();
    }
}
