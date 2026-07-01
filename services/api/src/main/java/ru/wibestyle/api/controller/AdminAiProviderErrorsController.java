package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.AiProviderErrorMappingRequest;
import ru.wibestyle.api.service.AiProviderErrorMappingService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/ai-provider-errors")
@SuppressWarnings("deprecation")
public class AdminAiProviderErrorsController {

    private final AiProviderErrorMappingService service;
    private final AdminProperties adminProperties;

    public AdminAiProviderErrorsController(
            AiProviderErrorMappingService service,
            AdminProperties adminProperties
    ) {
        this.service = service;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, List<Map<String, Object>>> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return Map.of("items", service.list());
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @Valid @RequestBody AiProviderErrorMappingRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return execute(() -> service.create(request));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID id,
            @Valid @RequestBody AiProviderErrorMappingRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return execute(() -> service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public void delete(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID id
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        execute(() -> {
            service.delete(id);
            return Map.of();
        });
    }

    private Map<String, Object> execute(Action action) {
        try {
            return action.run();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @FunctionalInterface
    private interface Action {
        Map<String, Object> run();
    }
}
