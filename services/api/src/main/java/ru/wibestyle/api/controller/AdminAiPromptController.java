package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.service.AiPromptTemplateService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai-prompts")
public class AdminAiPromptController {

    private final AiPromptTemplateService promptTemplateService;
    private final AdminProperties adminProperties;

    public AdminAiPromptController(AiPromptTemplateService promptTemplateService, AdminProperties adminProperties) {
        this.promptTemplateService = promptTemplateService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promptTemplateService.listTemplates();
    }

    @GetMapping("/{templateKey}")
    public Map<String, Object> get(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String templateKey
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promptTemplateService.getTemplate(templateKey);
    }

    @PutMapping("/{templateKey}")
    public Map<String, Object> update(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String templateKey,
            @Valid @RequestBody UpdateAiPromptRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promptTemplateService.updateBody(templateKey, request.body());
    }

    public record UpdateAiPromptRequest(
            @NotBlank @Size(max = 12000) String body
    ) {
    }
}
