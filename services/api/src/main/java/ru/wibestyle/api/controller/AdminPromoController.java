package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.CreatePromoRequest;
import ru.wibestyle.api.service.PromoService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/promo-codes")
public class AdminPromoController {

    private final PromoService promoService;
    private final AdminProperties adminProperties;

    public AdminPromoController(PromoService promoService, AdminProperties adminProperties) {
        this.promoService = promoService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promoService.listPromos();
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @Valid @RequestBody CreatePromoRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promoService.createPromo(
                request.code(),
                request.discountPercent(),
                request.maxUses(),
                request.expiresAt(),
                request.label()
        );
    }

    @PostMapping("/generate-code")
    public Map<String, Object> generateCode(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return Map.of("code", promoService.generateUniqueCode());
    }

    @PostMapping("/{promoId}/revoke")
    public Map<String, Object> revoke(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID promoId
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return promoService.revokePromo(promoId);
    }
}
