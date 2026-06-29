package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.MarketingChannelRequest;
import ru.wibestyle.api.service.MarketingAttributionService;
import ru.wibestyle.api.support.AdminSupport;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/marketing")
public class AdminMarketingController {
    private final MarketingAttributionService service;
    private final AdminProperties adminProperties;

    public AdminMarketingController(MarketingAttributionService service, AdminProperties adminProperties) {
        this.service = service;
        this.adminProperties = adminProperties;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                     @RequestParam(required = false) Instant from,
                                     @RequestParam(required = false) Instant to,
                                     @RequestParam(required = false) String source,
                                     @RequestParam(required = false) String medium,
                                     @RequestParam(required = false) String campaign,
                                     @RequestParam(defaultValue = "false") boolean detailed) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return service.adminStats(from, to, source, medium, campaign, detailed);
    }

    @GetMapping("/channels")
    public Map<String, Object> channels(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return Map.of("items", service.channels());
    }

    @GetMapping("/registrations")
    public Map<String, Object> registrations(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return service.adminRegistrations();
    }

    @PostMapping("/channels")
    public Map<String, Object> createChannel(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                             @Valid @RequestBody MarketingChannelRequest request) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return service.createChannel(request);
    }

    @PatchMapping("/channels/{id}")
    public Map<String, Object> updateChannel(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                             @PathVariable UUID id,
                                             @Valid @RequestBody MarketingChannelRequest request) {
        AdminSupport.requireAdminKey(key, adminProperties);
        return service.updateChannel(id, request);
    }
}
