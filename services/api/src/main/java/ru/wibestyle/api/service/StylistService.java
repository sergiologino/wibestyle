package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.StylistProductEntity;
import ru.wibestyle.api.domain.StylistSessionEntity;
import ru.wibestyle.api.domain.StylistVariantEntity;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.repository.StylistProductRepository;
import ru.wibestyle.api.repository.StylistSessionRepository;
import ru.wibestyle.api.repository.StylistVariantRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StylistService {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("Europe/Moscow");

    private static final List<StylistPreset> PRESETS = List.of(
            new StylistPreset("date", "Свидание", "Образ для встречи, где важно выглядеть собранно, мягко и запоминающе."),
            new StylistPreset("office", "Офис", "Рабочий образ без скуки: деловой силуэт, удобство и аккуратные акценты."),
            new StylistPreset("interview", "Собеседование", "Уверенный образ для первого впечатления и спокойной профессиональности."),
            new StylistPreset("wedding_guest", "Свадьба гостем", "Нарядный комплект без конкуренции с невестой и без лишней театральности."),
            new StylistPreset("party", "Вечеринка", "Более заметный образ для вечернего света, фото и движения."),
            new StylistPreset("vacation", "Отпуск", "Легкий образ для прогулок, кафе, фото и смены погоды."),
            new StylistPreset("photoshoot", "Фотосессия", "Выразительный комплект, который хорошо читается в кадре и держит силуэт."),
            new StylistPreset("city_weekend", "Городской выходной", "Повседневный look для прогулки, дел и встреч без ощущения случайности.")
    );

    private final FeatureFlagsProperties featureFlagsProperties;
    private final AiIntegrationProperties aiProperties;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final StylistSessionRepository sessionRepository;
    private final StylistVariantRepository variantRepository;
    private final StylistProductRepository productRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final QuotaService quotaService;
    private final SearchService searchService;
    private final AiPromptTemplateService promptTemplateService;
    private final NoteappAiClient aiClient;
    private final BlobStorage blobStorage;
    private final StylistPreviewWorker previewWorker;

    public StylistService(
            FeatureFlagsProperties featureFlagsProperties,
            AiIntegrationProperties aiProperties,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            StylistSessionRepository sessionRepository,
            StylistVariantRepository variantRepository,
            StylistProductRepository productRepository,
            TryOnSessionRepository tryOnSessionRepository,
            QuotaService quotaService,
            SearchService searchService,
            AiPromptTemplateService promptTemplateService,
            NoteappAiClient aiClient,
            BlobStorage blobStorage,
            StylistPreviewWorker previewWorker
    ) {
        this.featureFlagsProperties = featureFlagsProperties;
        this.aiProperties = aiProperties;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.sessionRepository = sessionRepository;
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.quotaService = quotaService;
        this.searchService = searchService;
        this.promptTemplateService = promptTemplateService;
        this.aiClient = aiClient;
        this.blobStorage = blobStorage;
        this.previewWorker = previewWorker;
    }

    public Map<String, Object> listPresets(UUID userId) {
        requireAvailable(userId);
        return Map.of("items", PRESETS.stream().map(StylistPreset::toMap).toList());
    }

    @Transactional
    public Map<String, Object> createLook(UUID userId, String presetId, String deviceId) {
        UserEntity user = requireAvailable(userId);
        StylistPreset preset = findPreset(presetId);
        AvatarSnapshotEntity avatar = findReadyAvatarSnapshot(user.getId());

        String season = seasonFor(LocalDate.now(PRODUCT_ZONE).getMonth());
        String avatarAnalysis = buildFallbackAvatarAnalysis();
        String trendNote = "Используем сезон " + season + " и практичные формулировки трендов без утверждения официального рейтинга.";

        if (aiProperties.isStylistTrendsConfigured() && avatar.getProcessedImagePath() != null) {
            try {
                AiTextContext aiText = generateAiTextContext(user, preset, avatar, season);
                avatarAnalysis = aiText.avatarAnalysis();
                trendNote = aiText.trendNote();
            } catch (RuntimeException | IOException ignored) {
                avatarAnalysis = buildFallbackAvatarAnalysis();
            }
        }

        Instant now = Instant.now();
        boolean imageConfigured = aiProperties.isStylistImageConfigured();
        UUID sessionId = UUID.randomUUID();
        StylistSessionEntity session = sessionRepository.save(new StylistSessionEntity(
                sessionId,
                user.getId(),
                avatar.getId(),
                preset.id(),
                preset.title(),
                season,
                avatarAnalysis,
                trendNote,
                imageConfigured ? "generating" : "ready",
                now,
                now
        ));
        if (imageConfigured) {
            reserveStylistQuota(session, avatar, deviceId, now);
        }

        List<StylistVariantEntity> variants = variantRepository.saveAll(buildVariants(session, preset, season, imageConfigured));
        List<StylistProductEntity> products = new ArrayList<>();
        for (StylistVariantEntity variant : variants) {
            products.addAll(buildDemoProducts(variant));
        }
        productRepository.saveAll(products);

        if (imageConfigured) {
            dispatchPreviews(variants);
        }
        return toLookMap(session, variants, products);
    }

    @Transactional
    public Map<String, Object> createLook(UUID userId, String presetId) {
        return createLook(userId, presetId, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLook(UUID userId, UUID sessionId) {
        requireAvailable(userId);
        StylistSessionEntity session = requireSession(userId, sessionId);
        List<StylistVariantEntity> variants = variantRepository.findBySessionIdOrderBySortOrderAsc(session.getId());
        List<StylistProductEntity> products = variants.stream()
                .flatMap(variant -> productRepository.findByVariantIdOrderBySortOrderAsc(variant.getId()).stream())
                .toList();
        return toLookMap(session, variants, products);
    }

    @Transactional
    public Map<String, Object> selectVariant(UUID userId, UUID sessionId, String variantKey) {
        requireAvailable(userId);
        StylistSessionEntity session = requireSession(userId, sessionId);
        StylistVariantEntity variant = variantRepository.findBySessionIdAndVariantKey(session.getId(), variantKey)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_STYLIST_VARIANT"));
        session.setSelectedVariantId(variant.getVariantKey());
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
        return getLook(userId, sessionId);
    }

    @Transactional
    public Map<String, Object> searchProductsForVariant(UUID userId, UUID sessionId, String variantKey) {
        requireAvailable(userId);
        StylistSessionEntity session = requireSession(userId, sessionId);
        StylistVariantEntity variant = variantRepository.findBySessionIdAndVariantKey(session.getId(), variantKey)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_STYLIST_VARIANT"));
        String query = productSearchQuery(session, variant);
        try {
            Map<String, Object> search = searchService.search(query, "wildberries");
            List<StylistProductEntity> products = productsFromSearch(variant, search);
            if (products.isEmpty()) {
                variant.setProductSearchStatus("empty");
            } else {
                productRepository.deleteByVariantId(variant.getId());
                productRepository.saveAll(products);
                variant.setProductSearchStatus("ready");
            }
        } catch (IllegalArgumentException ex) {
            variant.setProductSearchStatus("failed");
            variant.setErrorCode(ex.getMessage());
        }
        variant.setProductSearchQuery(query);
        variant.setUpdatedAt(Instant.now());
        variantRepository.save(variant);
        return getLook(userId, sessionId);
    }

    @Transactional(readOnly = true)
    public String requirePreviewPath(UUID userId, UUID sessionId, String variantKey) {
        requireAvailable(userId);
        StylistSessionEntity session = requireSession(userId, sessionId);
        StylistVariantEntity variant = variantRepository.findBySessionIdAndVariantKey(session.getId(), variantKey)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_STYLIST_VARIANT"));
        if (variant.getPreviewImagePath() == null || !blobStorage.exists(variant.getPreviewImagePath())) {
            throw new IllegalArgumentException("STYLIST_PREVIEW_NOT_READY");
        }
        return variant.getPreviewImagePath();
    }

    private UserEntity requireAvailable(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        if (!featureFlagsProperties.isStylistAvailableFor(user.isStylistFocusGroup())) {
            throw new IllegalArgumentException("STYLIST_DISABLED");
        }
        return user;
    }

    private StylistSessionEntity requireSession(UUID userId, UUID sessionId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("STYLIST_SESSION_NOT_FOUND"));
    }

    private void dispatchPreviews(List<StylistVariantEntity> variants) {
        Runnable dispatch = () -> variants.forEach(variant -> {
            if (aiProperties.isAsyncEnabled()) {
                previewWorker.generateAsync(variant.getId());
            } else {
                previewWorker.generate(variant.getId());
            }
        });
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatch.run();
                }
            });
            return;
        }
        dispatch.run();
    }

    private void reserveStylistQuota(StylistSessionEntity session, AvatarSnapshotEntity avatar, String deviceId, Instant now) {
        var profile = userProfileRepository.findById(session.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        if (!quotaService.canStartGeneration(profile, deviceId)) {
            throw new IllegalArgumentException(TryOnErrorCodes.INSUFFICIENT_GENERATIONS);
        }
        TryOnSessionEntity quotaSession = new TryOnSessionEntity(
                UUID.randomUUID(),
                session.getUserId(),
                avatar.getId(),
                TryOnSourceType.STYLIST_IDEA,
                TryOnSessionStatus.GENERATING,
                now,
                now
        );
        quotaSession.setMarketplace("other");
        quotaSession.setExternalProductId(stylistQuotaExternalId(session.getId()));
        quotaSession.setProductTitle("AI-стилист: " + session.getPresetTitle());
        quotaSession.setProductBrand("AI-стилист");
        quotaSession.setProductSizes("[]");
        quotaSession.setBeforeImageUrl("/api/v1/avatars/active/photo");
        quotaService.reserve(quotaSession, profile, deviceId);
        tryOnSessionRepository.save(quotaSession);
    }

    public static String stylistQuotaExternalId(UUID stylistSessionId) {
        return "stylist-quota:" + stylistSessionId;
    }

    private AiTextContext generateAiTextContext(UserEntity user, StylistPreset preset, AvatarSnapshotEntity avatar, String season) throws IOException {
        String analysisPrompt = promptTemplateService.getBodyOrDefault(
                AiPromptTemplateService.STYLIST_AVATAR_ANALYSIS_RU_KEY,
                "Проанализируй аватар мягко и практично."
        );
        String trendsPrompt = promptTemplateService.getBodyOrDefault(
                AiPromptTemplateService.STYLIST_TRENDS_RU_KEY,
                "Подбери три варианта образа под событие и сезон."
        );
        byte[] imageBytes = blobStorage.readBytes(avatar.getProcessedImagePath());
        String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);
        LocalDate today = LocalDate.now(PRODUCT_ZONE);
        String userText = "Событие: " + preset.title() + ". Дата: " + today
                + ". Сезон: " + season + ". Антропометрия: " + anthropometrySummary(avatar)
                + ". Верни короткий обзор и рекомендации без негатива. Пиши обычным текстом для веб-страницы: без Markdown, без ###, без **, без таблиц, без JSON. Не обрывай предложения. Дай 2-4 коротких абзаца.";
        String avatarAnalysis = aiClient.generateVisionChatText(
                aiProperties.getStylistTrendsNetwork(),
                user.getId().toString(),
                analysisPrompt,
                userText,
                imageBase64,
                "image/jpeg",
                700
        );
        String trendNote = aiClient.generateChatText(
                aiProperties.getStylistTrendsNetwork(),
                user.getId().toString(),
                trendsPrompt,
                "Событие: " + preset.title() + ". Дата: " + today + ". Сезон: " + season
                        + ". Аватар и антропометрия: " + avatarAnalysis + ". " + anthropometrySummary(avatar)
                        + ". Верни связный текст для веб-страницы: без Markdown, без ###, без **, без таблиц, без JSON. Не обрывай предложения. Опиши три варианта образа и общую логику подбора в 3-5 коротких абзацах.",
                1200
        );
        return new AiTextContext(plainTextForUi(avatarAnalysis), plainTextForUi(trendNote));
    }

    private List<StylistVariantEntity> buildVariants(StylistSessionEntity session, StylistPreset preset, String season, boolean imageConfigured) {
        Instant now = Instant.now();
        return List.of(
                variant(session, "classic", "Сдержанный классический", preset, season, "чистые линии, спокойная палитра, жакет или структурированный верх", imageConfigured, 0, now),
                variant(session, "modern", "Модный современный", preset, season, "актуальные пропорции, выразительная фактура, один трендовый акцент", imageConfigured, 1, now),
                variant(session, "rebel", "Вызывающий бунтарский", preset, season, "контраст, заметная обувь, острые аксессуары и более смелая укладка", imageConfigured, 2, now)
        );
    }

    private StylistVariantEntity variant(
            StylistSessionEntity session,
            String key,
            String title,
            StylistPreset preset,
            String season,
            String styleDirection,
            boolean imageConfigured,
            int sortOrder,
            Instant now
    ) {
        String summary = "Для сценария «" + preset.title() + "»: " + styleDirection + ".";
        String comment = "Образ держится на балансе события, сезона " + season + " и читаемой посадки. Его стоит собирать вещами, которые легко найти на Wildberries: верх, низ/платье, обувь и один акцентный аксессуар.";
        StylistVariantEntity variant = new StylistVariantEntity(
                UUID.randomUUID(),
                session.getId(),
                key,
                title,
                summary,
                styleDirection,
                comment,
                imageConfigured ? "queued" : "skipped",
                sortOrder,
                now,
                now
        );
        variant.setProductSearchQuery(productSearchQuery(session, variant));
        return variant;
    }

    private List<StylistProductEntity> buildDemoProducts(StylistVariantEntity variant) {
        int offset = variant.getSortOrder();
        return List.of(
                product(variant, "wb-style-" + variant.getVariantKey() + "-top", variant.getTitle() + " · верх", 3900 + offset * 700, 0),
                product(variant, "wb-style-" + variant.getVariantKey() + "-bottom", variant.getTitle() + " · низ или платье", 5200 + offset * 900, 1),
                product(variant, "wb-style-" + variant.getVariantKey() + "-shoes", variant.getTitle() + " · обувь", 6100 + offset * 800, 2)
        );
    }

    private StylistProductEntity product(StylistVariantEntity variant, String externalId, String title, int priceRub, int sortOrder) {
        return new StylistProductEntity(
                UUID.randomUUID(),
                variant.getId(),
                "wildberries",
                externalId,
                title,
                "Подбор стилиста",
                priceRub,
                "/assets/demo-garment.svg",
                "https://www.wildberries.ru/catalog/0/detail.aspx",
                sortOrder,
                Instant.now()
        );
    }

    private Map<String, Object> toLookMap(
            StylistSessionEntity session,
            List<StylistVariantEntity> variants,
            List<StylistProductEntity> products
    ) {
        Map<UUID, List<StylistProductEntity>> productsByVariant = products.stream()
                .collect(Collectors.groupingBy(StylistProductEntity::getVariantId));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.getId().toString());
        result.put("status", session.getStatus());
        result.put("preset", presetMap(session));
        result.put("avatarAnalysis", session.getAvatarAnalysis());
        result.put("trendNote", session.getTrendNote());
        result.put("selectedVariantId", session.getSelectedVariantId());
        result.put("variants", variants.stream()
                .map(variant -> toVariantMap(variant, productsByVariant.getOrDefault(variant.getId(), List.of())))
                .toList());
        result.put("imageGenerationConfigured", aiProperties.isStylistImageConfigured());
        result.put("createdAt", session.getCreatedAt().toString());
        result.put("updatedAt", session.getUpdatedAt().toString());
        return result;
    }

    private Map<String, Object> toVariantMap(StylistVariantEntity variant, List<StylistProductEntity> products) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", variant.getVariantKey());
        map.put("title", variant.getTitle());
        map.put("summary", variant.getSummary());
        map.put("stylistComment", variant.getStylistComment());
        map.put("productSearchStatus", variant.getProductSearchStatus());
        map.put("productSearchQuery", variant.getProductSearchQuery());
        if (isPollinationsPreview(variant)) {
            map.put("previewStatus", "failed");
            map.put("tryOnPreviewUrl", null);
            map.put("errorCode", "AI_PROVIDER_FALLBACK_NOT_ALLOWED");
            map.put("errorMessage", "Stylist preview requires Grok Imagine; Pollinations fallback is disabled");
        } else {
            map.put("previewStatus", variant.getPreviewStatus());
            map.put("tryOnPreviewUrl", variant.getPreviewImageUrl());
            map.put("errorCode", variant.getErrorCode());
            map.put("errorMessage", variant.getErrorMessage());
        }
        map.put("products", products.stream().map(this::toProductMap).toList());
        return map;
    }

    @SuppressWarnings("unchecked")
    private List<StylistProductEntity> productsFromSearch(StylistVariantEntity variant, Map<String, Object> search) {
        Object rawItems = search.get("items");
        if (!(rawItems instanceof List<?> items)) {
            return List.of();
        }
        List<StylistProductEntity> result = new ArrayList<>();
        int sort = 0;
        for (Object raw : items) {
            if (!(raw instanceof Map<?, ?> item)) {
                continue;
            }
            String marketplace = stringValue(item.get("marketplace"), "wildberries");
            if (!"wildberries".equalsIgnoreCase(marketplace)) {
                continue;
            }
            String externalId = stringValue(item.get("id"), "wb-style-" + variant.getVariantKey() + "-" + sort);
            String title = stringValue(item.get("title"), variant.getTitle());
            String brand = stringValue(item.get("brand"), "Wildberries");
            Integer priceRub = intValue(item.get("priceRub"));
            String imageUrl = stringValue(item.get("imageUrl"), "/assets/demo-garment.svg");
            String productUrl = stringValue(item.get("productUrl"), "https://www.wildberries.ru/catalog/" + externalId);
            result.add(new StylistProductEntity(
                    UUID.randomUUID(),
                    variant.getId(),
                    "wildberries",
                    externalId,
                    title,
                    brand,
                    priceRub,
                    imageUrl,
                    productUrl,
                    sort++,
                    Instant.now()
            ));
        }
        return result;
    }

    private static String productSearchQuery(StylistSessionEntity session, StylistVariantEntity variant) {
        return session.getPresetTitle()
                + ", " + session.getSeason()
                + ", " + variant.getTitle()
                + ", " + variant.getStyleDirection()
                + ", одежда обувь аксессуары";
    }

    private static String stringValue(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? fallback : text;
    }

    private static Integer intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Map<String, Object> toProductMap(StylistProductEntity product) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", product.getExternalProductId());
        map.put("marketplace", product.getMarketplace());
        map.put("title", product.getTitle());
        map.put("brand", product.getBrand());
        map.put("priceRub", product.getPriceRub());
        map.put("imageUrl", product.getImageUrl());
        map.put("productUrl", product.getProductUrl());
        return map;
    }

    private static Map<String, Object> presetMap(StylistSessionEntity session) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", session.getPresetId());
        map.put("title", session.getPresetTitle());
        map.put("description", findPreset(session.getPresetId()).description());
        return map;
    }

    private static StylistPreset findPreset(String presetId) {
        return PRESETS.stream()
                .filter(preset -> preset.id().equals(presetId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("INVALID_STYLIST_PRESET"));
    }

    private static String buildFallbackAvatarAnalysis() {
        return "Аватар готов для подбора образа. Учитываем рост, основные обхваты, размер одежды и сохраняем естественные пропорции. Рекомендации формулируем через силуэт, посадку, вертикали, цветовую гармонию и акценты.";
    }

    private AvatarSnapshotEntity findReadyAvatarSnapshot(UUID userId) {
        return avatarSnapshotRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(snapshot -> snapshot.getProcessedImagePath() != null && blobStorage.exists(snapshot.getProcessedImagePath()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("AVATAR_NOT_READY"));
    }

    private static boolean isPollinationsPreview(StylistVariantEntity variant) {
        return containsIgnoreCase(variant.getProvider(), "pollinations")
                || containsIgnoreCase(variant.getPreviewImageUrl(), "pollinations.ai");
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        return value != null && needle != null && value.toLowerCase(java.util.Locale.ROOT).contains(needle.toLowerCase(java.util.Locale.ROOT));
    }

    private static String plainTextForUi(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replaceAll("(?m)^\\s*#{1,6}\\s*", "")
                .replace("**", "")
                .replace("__", "")
                .replaceAll("(?m)^\\s*[-*]\\s+", "")
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private static String anthropometrySummary(AvatarSnapshotEntity avatar) {
        return "heightCm=" + avatar.getHeightCm()
                + ", bustCm=" + avatar.getBustCm()
                + ", waistCm=" + avatar.getWaistCm()
                + ", hipsCm=" + avatar.getHipsCm()
                + ", shoeSizeEu=" + avatar.getShoeSizeEu()
                + ", clothingSize=" + avatar.getClothingSize();
    }

    private static String seasonFor(Month month) {
        return switch (month) {
            case DECEMBER, JANUARY, FEBRUARY -> "зима";
            case MARCH, APRIL, MAY -> "весна";
            case JUNE, JULY, AUGUST -> "лето";
            case SEPTEMBER, OCTOBER, NOVEMBER -> "осень";
        };
    }

    private record StylistPreset(String id, String title, String description) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", id);
            map.put("title", title);
            map.put("description", description);
            return map;
        }
    }

    private record AiTextContext(String avatarAnalysis, String trendNote) {
    }
}
