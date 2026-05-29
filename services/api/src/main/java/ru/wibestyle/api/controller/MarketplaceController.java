package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.ParseLinkRequest;
import ru.wibestyle.api.marketplace.OzonCatalog;
import ru.wibestyle.api.service.MarketplaceService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplaces")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @PostMapping("/parse-link")
    public Map<String, Object> parseLink(
            @Valid @RequestBody ParseLinkRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UUID userId = tryUserId(authorization);
        return marketplaceService.parseLink(request.url(), userId);
    }

    private static UUID tryUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    @GetMapping("/wildberries/{productId}/image")
    public ResponseEntity<byte[]> wildberriesImage(@PathVariable String productId) {
        byte[] image = marketplaceService.loadWildberriesImage(productId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/webp"))
                .body(image);
    }

    @GetMapping("/ozon/{productSlug}/image")
    public ResponseEntity<byte[]> ozonImage(@PathVariable String productSlug) {
        byte[] image = marketplaceService.loadOzonImage(productSlug);
        return ResponseEntity.ok()
                .contentType(OzonCatalog.detectImageMediaType(image))
                .body(image);
    }
}
