package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.UpdatePlatformSettingsRequest;
import ru.wibestyle.api.service.PlatformSettingsService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/settings")
public class AdminSettingsController {

    private final PlatformSettingsService platformSettingsService;
    private final AdminProperties adminProperties;

    public AdminSettingsController(PlatformSettingsService platformSettingsService, AdminProperties adminProperties) {
        this.platformSettingsService = platformSettingsService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> get(@RequestHeader("X-Admin-Key") String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return platformSettingsService.snapshot();
    }

    @PatchMapping
    public Map<String, Object> update(
            @RequestHeader("X-Admin-Key") String adminKey,
            @Valid @RequestBody UpdatePlatformSettingsRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        if (request.blockGoogleOAuth() != null) {
            platformSettingsService.setBlockGoogleOAuth(request.blockGoogleOAuth());
        }
        return platformSettingsService.snapshot();
    }
}
