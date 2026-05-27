package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.PromoCodeEntity;
import ru.wibestyle.api.domain.PromoCodeRedemptionEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.promo.PromoCodeValidator;
import ru.wibestyle.api.repository.PromoCodeRedemptionRepository;
import ru.wibestyle.api.repository.PromoCodeRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PromoService {

    private final PromoCodeRepository promoCodeRepository;
    private final PromoCodeRedemptionRepository redemptionRepository;
    private final UserProfileRepository userProfileRepository;

    public PromoService(
            PromoCodeRepository promoCodeRepository,
            PromoCodeRedemptionRepository redemptionRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.promoCodeRepository = promoCodeRepository;
        this.redemptionRepository = redemptionRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validate(String rawCode) {
        PromoCodeEntity promo = requireActivePromo(rawCode);
        return toValidationMap(promo);
    }

    @Transactional
    public Map<String, Object> redeemForUser(UUID userId, String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            return Map.of("redeemed", false);
        }

        PromoCodeValidator.validateFormat(rawCode);
        String code = PromoCodeValidator.normalize(rawCode);
        PromoCodeEntity promo = promoCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("PROMO_NOT_FOUND"));

        Instant now = Instant.now();
        assertPromoUsable(promo, now);

        if (redemptionRepository.existsByPromoCodeIdAndUserId(promo.getId(), userId)) {
            throw new IllegalArgumentException("PROMO_ALREADY_USED");
        }

        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));

        if (profile.getActivePromoCodeId() != null) {
            throw new IllegalArgumentException("PROMO_ALREADY_APPLIED");
        }

        redemptionRepository.save(new PromoCodeRedemptionEntity(
                UUID.randomUUID(),
                promo.getId(),
                userId,
                now
        ));
        promo.setUsesCount(promo.getUsesCount() + 1);
        promoCodeRepository.save(promo);

        profile.setActivePromoCodeId(promo.getId());
        profile.setPromoDiscountPercent(promo.getDiscountPercent());
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("redeemed", true);
        response.put("promo", toPromoMap(promo));
        return response;
    }

    @Transactional
    public Map<String, Object> createPromo(String rawCode, int discountPercent, int maxUses, Instant expiresAt, String label) {
        if (discountPercent < 1 || discountPercent > 90) {
            throw new IllegalArgumentException("PROMO_INVALID_DISCOUNT");
        }
        if (maxUses < 1) {
            throw new IllegalArgumentException("PROMO_INVALID_MAX_USES");
        }
        if (expiresAt.isBefore(Instant.now())) {
            throw new IllegalArgumentException("PROMO_INVALID_EXPIRY");
        }

        String code;
        if (rawCode == null || rawCode.isBlank()) {
            code = generateUniqueCode();
        } else {
            PromoCodeValidator.validateFormat(rawCode);
            code = PromoCodeValidator.normalize(rawCode);
            if (promoCodeRepository.findByCode(code).isPresent()) {
                throw new IllegalArgumentException("PROMO_CODE_EXISTS");
            }
        }

        PromoCodeEntity entity = new PromoCodeEntity(
                UUID.randomUUID(),
                code,
                discountPercent,
                maxUses,
                expiresAt,
                label,
                Instant.now()
        );
        promoCodeRepository.save(entity);
        return Map.of("promo", toPromoMap(entity));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPromos() {
        List<Map<String, Object>> items = promoCodeRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toPromoMap)
                .toList();
        return Map.of("items", items);
    }

    @Transactional
    public Map<String, Object> revokePromo(UUID promoId) {
        PromoCodeEntity promo = promoCodeRepository.findById(promoId)
                .orElseThrow(() -> new IllegalArgumentException("PROMO_NOT_FOUND"));
        if (promo.getRevokedAt() != null) {
            throw new IllegalArgumentException("PROMO_ALREADY_REVOKED");
        }
        promo.setRevokedAt(Instant.now());
        promoCodeRepository.save(promo);
        return Map.of("promo", toPromoMap(promo));
    }

    public String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = PromoCodeValidator.generateCode(8);
            if (promoCodeRepository.findByCode(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException("PROMO_GENERATION_FAILED");
    }

    private PromoCodeEntity requireActivePromo(String rawCode) {
        PromoCodeValidator.validateFormat(rawCode);
        String code = PromoCodeValidator.normalize(rawCode);
        PromoCodeEntity promo = promoCodeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("PROMO_NOT_FOUND"));
        assertPromoUsable(promo, Instant.now());
        return promo;
    }

    private void assertPromoUsable(PromoCodeEntity promo, Instant now) {
        if (promo.getRevokedAt() != null) {
            throw new IllegalArgumentException("PROMO_REVOKED");
        }
        if (promo.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("PROMO_EXPIRED");
        }
        if (promo.getUsesCount() >= promo.getMaxUses()) {
            throw new IllegalArgumentException("PROMO_EXHAUSTED");
        }
    }

    private Map<String, Object> toValidationMap(PromoCodeEntity promo) {
        Map<String, Object> map = new HashMap<>();
        map.put("valid", true);
        map.put("code", promo.getCode());
        map.put("discountPercent", promo.getDiscountPercent());
        map.put("usesLeft", promo.getMaxUses() - promo.getUsesCount());
        map.put("expiresAt", promo.getExpiresAt().toString());
        if (promo.getLabel() != null) {
            map.put("label", promo.getLabel());
        }
        return map;
    }

    private Map<String, Object> toPromoMap(PromoCodeEntity promo) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", promo.getId().toString());
        map.put("code", promo.getCode());
        map.put("discountPercent", promo.getDiscountPercent());
        map.put("maxUses", promo.getMaxUses());
        map.put("usesCount", promo.getUsesCount());
        map.put("usesLeft", Math.max(0, promo.getMaxUses() - promo.getUsesCount()));
        map.put("expiresAt", promo.getExpiresAt().toString());
        map.put("createdAt", promo.getCreatedAt().toString());
        map.put("active", promo.isActive(Instant.now()));
        if (promo.getLabel() != null) {
            map.put("label", promo.getLabel());
        }
        if (promo.getRevokedAt() != null) {
            map.put("revokedAt", promo.getRevokedAt().toString());
        }
        return map;
    }
}
