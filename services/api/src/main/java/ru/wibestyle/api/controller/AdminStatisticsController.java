package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.service.AdminStatisticsService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/statistics")
public class AdminStatisticsController {
    private final AdminStatisticsService service;
    private final AdminProperties adminProperties;

    public AdminStatisticsController(AdminStatisticsService service, AdminProperties adminProperties) {
        this.service = service;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> dashboard(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return service.dashboard();
    }
}
