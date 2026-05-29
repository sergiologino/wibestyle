package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.DomainEvents;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.domain.TryOnJobEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.marketplace.MarketplaceAdapter;
import ru.wibestyle.api.marketplace.MarketplaceAdapterRegistry;
import ru.wibestyle.api.marketplace.ProductDetails;
import ru.wibestyle.api.marketplace.ProductSizeChartJson;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TryOnService {

    private final TryOnSessionRepository tryOnSessionRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final UserProfileRepository userProfileRepository;
    private final MarketplaceAdapterRegistry marketplaceAdapterRegistry;
    private final LocalStorageService localStorageService;
    private final AiTryOnService aiTryOnService;
    private final ObjectMapper objectMapper;
    private final QuotaService quotaService;
    private final GarmentImageService garmentImageService;

    public TryOnService(
            TryOnSessionRepository tryOnSessionRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            UserProfileRepository userProfileRepository,
            MarketplaceAdapterRegistry marketplaceAdapterRegistry,
            LocalStorageService localStorageService,
            AiTryOnService aiTryOnService,
            ObjectMapper objectMapper,
            QuotaService quotaService,
            GarmentImageService garmentImageService
    ) {
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.userProfileRepository = userProfileRepository;
        this.marketplaceAdapterRegistry = marketplaceAdapterRegistry;
        this.localStorageService = localStorageService;
        this.aiTryOnService = aiTryOnService;
        this.objectMapper = objectMapper;
        this.quotaService = quotaService;
        this.garmentImageService = garmentImageService;
    }

    @Transactional
    public Map<String, Object> createLinkSession(UUID userId, String url, String selectedSize) {
        AvatarSnapshotEntity snapshot = requireSnapshot(userId);
        MarketplaceAdapter adapter;
        try {
            adapter = marketplaceAdapterRegistry.resolve(url);
        } catch (IllegalArgumentException ex) {
            throw ex;
        }

        String normalizedUrl = adapter.normalizeUrl(url);
        String productId = adapter.extractProductId(normalizedUrl);
        ProductDetails product = MarketplaceService.fetchProductDetails(adapter, productId, normalizedUrl);

        if (product.images() == null || product.images().isEmpty()) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND);
        }

        Instant now = Instant.now();
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                userId,
                snapshot.getId(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.DRAFT,
                now,
                now
        );
        applyProduct(session, product, selectedSize);
        tryOnSessionRepository.save(session);
        try {
            garmentImageService.ensureLocalGarmentPhoto(userId, session);
            tryOnSessionRepository.save(session);
        } catch (IOException ex) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND, ex);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("session", toSessionMap(session));
        response.put("product", toProductMap(session));
        response.put("event", DomainEvents.TRYON_SESSION_CREATED);
        return response;
    }

    private static final List<String> DEFAULT_PHOTO_SIZES = List.of("XS", "S", "M", "L", "XL");

    @Transactional
    public Map<String, Object> createPhotoSession(
            UUID userId,
            MultipartFile photo,
            String category,
            TryOnSourceType sourceType,
            String selectedSize
    ) throws IOException {
        AvatarSnapshotEntity snapshot = requireSnapshot(userId);
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND);
        }

        Instant now = Instant.now();
        UUID sessionId = UUID.randomUUID();
        String extension = extensionFromContentType(photo.getContentType());
        String storedPath = localStorageService.storeGarmentPhoto(userId, sessionId, extension, photo.getInputStream());

        TryOnSessionEntity session = new TryOnSessionEntity(
                sessionId,
                userId,
                snapshot.getId(),
                sourceType,
                TryOnSessionStatus.DRAFT,
                now,
                now
        );
        String resolvedCategory = category == null || category.isBlank() ? "other" : category;
        session.setGarmentCategory(resolvedCategory);
        session.setGarmentPhotoPath(storedPath);
        session.setProductImageUrl("/api/v1/try-on/sessions/" + sessionId + "/garment-photo");
        session.setMarketplace("other");
        session.setProductTitle(categoryTitle(resolvedCategory));
        session.setProductBrand("Фото из галереи");
        session.setProductSizes(serializeSizes(DEFAULT_PHOTO_SIZES));
        session.setSelectedSize(resolveSelectedSize(selectedSize, DEFAULT_PHOTO_SIZES));
        tryOnSessionRepository.save(session);

        Map<String, Object> response = new HashMap<>();
        response.put("session", toSessionMap(session));
        response.put("event", DomainEvents.TRYON_SESSION_CREATED);
        return response;
    }

    @Transactional
    public Map<String, Object> generate(UUID userId, UUID sessionId) {
        TryOnSessionEntity session = requireSession(userId, sessionId);
        if (session.getStatus() == TryOnSessionStatus.READY) {
            return buildGenerateResponse(session, null);
        }
        if (session.getStatus() == TryOnSessionStatus.GENERATING) {
            return Map.of("session", toSessionMap(session));
        }
        if (session.getStatus() == TryOnSessionStatus.FAILED) {
            session.setStatus(TryOnSessionStatus.DRAFT);
            session.setErrorCode(null);
            session.setErrorMessage(null);
            session.setUpdatedAt(Instant.now());
        }

        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        if (!quotaService.canStartGeneration(profile)) {
            throw new IllegalArgumentException(TryOnErrorCodes.INSUFFICIENT_GENERATIONS);
        }

        aiTryOnService.ensureProductImageOrFail(session);

        quotaService.reserve(session, profile);
        session.setStatus(TryOnSessionStatus.GENERATING);
        session.setUpdatedAt(Instant.now());
        TryOnJobEntity job = aiTryOnService.enqueuePhotoTryOn(session);
        tryOnSessionRepository.save(session);

        aiTryOnService.dispatch(job);
        tryOnSessionRepository.flush();

        session = requireSession(userId, sessionId);
        return buildGenerateResponse(session, profile);
    }

    private Map<String, Object> buildGenerateResponse(TryOnSessionEntity session, UserProfileEntity profile) {
        Map<String, Object> response = new HashMap<>();
        response.put("session", toSessionMap(session));
        if (session.getStatus() == TryOnSessionStatus.READY) {
            response.put("result", toResultMap(session));
        }
        if (profile != null) {
            response.put("trialGenerationsLeft", profile.getTrialGenerationsLeft());
            response.put("planGenerationsLeft", profile.getPlanGenerationsLeft());
        } else {
            userProfileRepository.findById(session.getUserId())
                    .ifPresent(p -> {
                        response.put("trialGenerationsLeft", p.getTrialGenerationsLeft());
                        response.put("planGenerationsLeft", p.getPlanGenerationsLeft());
                    });
        }
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listMine(UUID userId) {
        List<TryOnSessionEntity> sessions = tryOnSessionRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(userId, TryOnSessionStatus.READY);
        List<Map<String, Object>> items = sessions.stream()
                .map(this::toHistoryMap)
                .toList();
        return Map.of("items", items);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSession(UUID userId, UUID sessionId) {
        TryOnSessionEntity session = requireSession(userId, sessionId);
        Map<String, Object> response = new HashMap<>();
        response.put("session", toSessionMap(session));
        if (session.getProductTitle() != null) {
            response.put("product", toProductMap(session));
        }
        if (session.getStatus() == TryOnSessionStatus.READY) {
            response.put("result", toResultMap(session));
        } else if (session.getStatus() == TryOnSessionStatus.FAILED) {
            response.put("failed", true);
        }
        return response;
    }

    @Transactional(readOnly = true)
    public TryOnSessionEntity requireSession(UUID userId, UUID sessionId) {
        return tryOnSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException(TryOnErrorCodes.SESSION_NOT_FOUND));
    }

    private AvatarSnapshotEntity requireSnapshot(UUID userId) {
        return avatarSnapshotRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException(TryOnErrorCodes.AVATAR_NOT_READY));
    }

    private void applyProduct(TryOnSessionEntity session, ProductDetails product, String selectedSize) {
        session.setMarketplace(product.marketplace());
        session.setExternalProductId(product.externalProductId());
        session.setProductUrl(product.originalUrl());
        session.setProductTitle(product.title());
        session.setProductBrand(product.brand());
        session.setProductPriceRub(product.priceRub());
        session.setProductImageUrl(product.images().get(0));
        session.setProductSizes(serializeSizes(product.availableSizes()));
        session.setSelectedSize(resolveSelectedSize(selectedSize, product.availableSizes()));
        session.setSizeWarning(resolveSizeWarning(session.getSelectedSize(), product.availableSizes()));
        session.setProductSizeChart(ProductSizeChartJson.serialize(objectMapper, product.sizeChart()));
        if (product.categories() != null && !product.categories().isEmpty()) {
            session.setGarmentCategory(product.categories().get(0));
        }
    }

    private String resolveSelectedSize(String selectedSize, List<String> availableSizes) {
        if (selectedSize != null && !selectedSize.isBlank()) {
            return selectedSize;
        }
        if (availableSizes != null && !availableSizes.isEmpty()) {
            return availableSizes.contains("M") ? "M" : availableSizes.get(0);
        }
        return null;
    }

    private String resolveSizeWarning(String selectedSize, List<String> availableSizes) {
        if (selectedSize == null || availableSizes == null || availableSizes.isEmpty()) {
            return null;
        }
        if (!availableSizes.contains(selectedSize)) {
            return TryOnErrorCodes.SIZE_NOT_AVAILABLE;
        }
        return null;
    }

    private String serializeSizes(List<String> sizes) {
        try {
            return objectMapper.writeValueAsString(sizes);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }

    private List<String> deserializeSizes(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(raw, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private Map<String, Object> toHistoryMap(TryOnSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        map.put("sessionId", session.getId().toString());
        map.put("productTitle", session.getProductTitle() != null ? session.getProductTitle() : "Мой look");
        map.put("productUrl", session.getProductUrl());
        map.put("marketplace", session.getMarketplace());
        map.put("afterImageUrl", session.getAfterImageUrl());
        map.put("selectedSize", session.getSelectedSize());
        map.put("sourceType", sourceTypeJson(session.getSourceType()));
        map.put("createdAt", session.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> toSessionMap(TryOnSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", session.getId().toString());
        map.put("userId", session.getUserId().toString());
        map.put("avatarSnapshotId", session.getAvatarSnapshotId() == null ? null : session.getAvatarSnapshotId().toString());
        map.put("sourceType", sourceTypeJson(session.getSourceType()));
        map.put("status", session.getStatus().name().toLowerCase());
        map.put("visibility", session.getVisibility());
        map.put("selectedSize", session.getSelectedSize());
        map.put("garmentCategory", session.getGarmentCategory());
        map.put("sizeWarning", session.getSizeWarning());
        map.put("errorCode", session.getErrorCode());
        map.put("errorMessage", session.getErrorMessage());
        map.put("createdAt", session.getCreatedAt().toString());
        map.put("updatedAt", session.getUpdatedAt().toString());
        return map;
    }

    private Map<String, Object> toProductMap(TryOnSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", session.getExternalProductId());
        map.put("marketplace", session.getMarketplace());
        map.put("title", session.getProductTitle());
        map.put("brand", session.getProductBrand());
        map.put("priceRub", session.getProductPriceRub());
        map.put("imageUrl", session.getProductImageUrl());
        map.put("sizes", deserializeSizes(session.getProductSizes()));
        map.put("productUrl", session.getProductUrl());
        return map;
    }

    private Map<String, Object> toResultMap(TryOnSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        map.put("sessionId", session.getId().toString());
        map.put("beforeImageUrl", session.getBeforeImageUrl());
        map.put("afterImageUrl", session.getAfterImageUrl());
        map.put("selectedSize", session.getSelectedSize());
        map.put("eliteFrame", false);
        if (session.getSizeFitStatus() != null) {
            map.put("sizeFitStatus", session.getSizeFitStatus());
        }
        if (session.getRecommendedSize() != null) {
            map.put("recommendedSize", session.getRecommendedSize());
        }
        if (session.getSizeFitMessage() != null) {
            map.put("sizeFitMessage", session.getSizeFitMessage());
        }
        if (session.getProductTitle() != null) {
            map.put("product", toProductMap(session));
        }
        return map;
    }

    private static String sourceTypeJson(TryOnSourceType sourceType) {
        return switch (sourceType) {
            case MARKETPLACE_LINK -> "marketplace_link";
            case GARMENT_PHOTO -> "garment_photo";
            case GALLERY_UPLOAD -> "gallery_upload";
        };
    }

    private static String categoryTitle(String category) {
        return switch (category) {
            case "dress" -> "Платье";
            case "top" -> "Верх";
            case "pants" -> "Брюки";
            case "jacket" -> "Пиджак";
            case "shoes" -> "Обувь";
            case "accessory" -> "Аксессуар";
            default -> "Одежда";
        };
    }

    private static String extensionFromContentType(String contentType) {
        if (contentType == null) {
            return ".jpg";
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
