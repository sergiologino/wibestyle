package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.UpdateLeadStatusRequest;
import ru.wibestyle.api.service.LeadService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/leads")
public class AdminLeadController {

    private final LeadService leadService;
    private final AdminProperties adminProperties;

    public AdminLeadController(LeadService leadService, AdminProperties adminProperties) {
        this.leadService = leadService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestParam(required = false) String status
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return leadService.listForAdmin(status);
    }

    @GetMapping("/export.csv")
    public ResponseEntity<String> exportCsv(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestParam(required = false) String status
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        String csv = leadService.exportCsv(status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"landing-leads.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @PatchMapping("/{leadId}/status")
    public Map<String, Object> updateStatus(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID leadId,
            @Valid @RequestBody UpdateLeadStatusRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return leadService.updateStatus(leadId, request.status());
    }
}
