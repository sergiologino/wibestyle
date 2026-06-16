package ru.wibestyle.api.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.AdminRole;
import ru.wibestyle.api.domain.AiIntegrationLogEntity;
import ru.wibestyle.api.repository.AdminUserRepository;
import ru.wibestyle.api.repository.AiIntegrationLogRepository;
import ru.wibestyle.api.service.AiIntegrationLogService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminAiLogsController {

    private final AiIntegrationLogRepository logRepository;
    private final AdminProperties adminProperties;
    private final JwtService jwtService;
    private final AdminUserRepository adminUserRepository;

    public AdminAiLogsController(
            AiIntegrationLogRepository logRepository,
            AdminProperties adminProperties,
            JwtService jwtService,
            AdminUserRepository adminUserRepository
    ) {
        this.logRepository = logRepository;
        this.adminProperties = adminProperties;
        this.jwtService = jwtService;
        this.adminUserRepository = adminUserRepository;
    }

    @GetMapping("/ai-logs")
    public Map<String, Object> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        requireViewAiLogs(adminKey, authorization);
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 100);
        Page<AiIntegrationLogEntity> result = logRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        List<Map<String, Object>> items = result.getContent().stream().map(this::toItem).toList();
        return Map.of(
                "items", items,
                "page", pageIndex,
                "size", pageSize,
                "total", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    private void requireViewAiLogs(String adminKey, String authorization) {
        try {
            AdminSupport.AdminActor actor = AdminSupport.resolve(
                    adminKey, authorization, adminProperties, jwtService, adminUserRepository
            );
            AdminSupport.requireRole(actor, AdminRole::canViewAiLogs);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    "ADMIN_FORBIDDEN".equals(ex.getMessage()) ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED,
                    ex.getMessage(),
                    ex
            );
        }
    }

    private Map<String, Object> toItem(AiIntegrationLogEntity log) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", log.getId().toString());
        item.put("tryOnSessionId", log.getTryOnSessionId() != null ? log.getTryOnSessionId().toString() : null);
        item.put("userId", log.getUserId() != null ? log.getUserId().toString() : null);
        item.put("phase", log.getPhase());
        item.put("title", log.getTitle());
        item.put("body", log.getBody());
        item.put("modelName", log.getModelName());
        item.put("modelLabel", AiIntegrationLogService.humanModelLabel(log.getModelName(), log.getProvider()));
        item.put("provider", log.getProvider());
        item.put("operation", log.getOperation());
        item.put("attemptNumber", log.getAttemptNumber());
        item.put("fallbackReason", log.getFallbackReason());
        item.put("status", log.getStatus());
        item.put("noteappRequestId", log.getNoteappRequestId());
        item.put("createdAt", log.getCreatedAt().toString());
        return item;
    }
}
