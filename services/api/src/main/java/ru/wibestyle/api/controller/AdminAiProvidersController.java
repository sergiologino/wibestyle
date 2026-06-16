package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.AiProviderPriorityRequest;
import ru.wibestyle.api.service.AiProviderPriorityService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai-providers")
public class AdminAiProvidersController {

    private final AiProviderPriorityService aiProviderPriorityService;
    private final AdminProperties adminProperties;

    public AdminAiProvidersController(
            AiProviderPriorityService aiProviderPriorityService,
            AdminProperties adminProperties
    ) {
        this.aiProviderPriorityService = aiProviderPriorityService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return aiProviderPriorityService.snapshot();
    }

    @PutMapping("/{operation}")
    public Map<String, Object> update(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String operation,
            @Valid @RequestBody AiProviderPriorityRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        try {
            return Map.of(
                    "operation", operation,
                    "items", aiProviderPriorityService.update(operation, request)
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
