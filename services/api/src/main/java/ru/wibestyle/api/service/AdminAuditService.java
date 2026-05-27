package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.AdminAuditLogEntity;
import ru.wibestyle.api.repository.AdminAuditLogRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminAuditService {

    private final AdminAuditLogRepository adminAuditLogRepository;

    public AdminAuditService(AdminAuditLogRepository adminAuditLogRepository) {
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    @Transactional
    public void record(String actor, String action, String entityType, String entityId, String ipAddress, String details) {
        adminAuditLogRepository.save(new AdminAuditLogEntity(
                UUID.randomUUID(),
                actor,
                action,
                entityType,
                entityId,
                ipAddress,
                details,
                Instant.now()
        ));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listRecent() {
        List<Map<String, Object>> items = adminAuditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(this::toMap)
                .toList();
        return Map.of("items", items);
    }

    private Map<String, Object> toMap(AdminAuditLogEntity log) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", log.getId().toString());
        map.put("actor", log.getActor());
        map.put("action", log.getAction());
        map.put("entityType", log.getEntityType());
        map.put("entityId", log.getEntityId());
        map.put("ipAddress", log.getIpAddress());
        map.put("details", log.getDetails());
        map.put("createdAt", log.getCreatedAt().toString());
        return map;
    }
}
