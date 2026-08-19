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
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.CreateManualPushRequest;
import ru.wibestyle.api.service.ManualPushService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/manual-pushes")
public class AdminManualPushController {
    private final ManualPushService manualPushService;
    private final AdminProperties adminProperties;

    public AdminManualPushController(ManualPushService manualPushService, AdminProperties adminProperties) {
        this.manualPushService = manualPushService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return manualPushService.list();
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @Valid @RequestBody CreateManualPushRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        try {
            return manualPushService.create(
                    request.title(),
                    request.body(),
                    request.audience(),
                    request.scheduledAt(),
                    request.actionUrl()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
