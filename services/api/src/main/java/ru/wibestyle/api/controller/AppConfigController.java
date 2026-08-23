package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.service.PlatformSettingsService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/app/config")
public class AppConfigController {

    private final PlatformSettingsService platformSettingsService;

    public AppConfigController(PlatformSettingsService platformSettingsService) {
        this.platformSettingsService = platformSettingsService;
    }

    @GetMapping
    public Map<String, Object> get() {
        return platformSettingsService.mobileAppConfig();
    }
}
