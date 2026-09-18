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

    @Transactional
    public Map<String, Object> regenerateVariant(UUID userId, UUID sessionId, String variantKey, String deviceId) {
        UserEntity user = requireAvailable(userId);
        StylistSessionEntity session = requireSession(user.getId(), sessionId);
        StylistVariantEntity variant = variantRepository.findBySessionIdAndVariantKey(session.getId(), variantKey)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_STYLIST_VARIANT"));
        AvatarSnapshotEntity avatar = findReadyAvatarSnapshot(user.getId());
        Instant now = Instant.now();
        int nextRegeneration = variant.getRegenerationCount() + 1;
        boolean chargeQuota = variant.getRegenerationCount() > 0 && aiProperties.isStylistImageConfigured();
        if (chargeQuota) {
            reserveStylistRegenerationQuota(session, variant, avatar, deviceId, nextRegeneration, now);
        }

        StyleBrief brief = styleBrief(session.getPresetId(), session.getPresetTitle(), session.getSeason(), variant.getVariantKey(), nextRegeneration);
        variant.setTitle(brief.title());
        variant.setSummary(brief.summary());
        variant.setStyleDirection(brief.direction());
        variant.setStylistComment(brief.comment());
        variant.setProductSearchStatus("demo");
        variant.setProductSearchQuery(productSearchQuery(session, variant));
        variant.setPreviewStatus(aiProperties.isStylistImageConfigured() ? "queued" : "skipped");
        variant.setPreviewImagePath(null);
        variant.setPreviewImageUrl(null);
        variant.setProvider(null);
        variant.setExternalRequestId(null);
        variant.setErrorCode(null);
        variant.setErrorMessage(null);
        variant.setRegenerationCount(nextRegeneration);
        variant.setUpdatedAt(now);
        variantRepository.save(variant);

        productRepository.deleteByVariantId(variant.getId());
        productRepository.saveAll(buildDemoProducts(variant));

        session.setStatus(aiProperties.isStylistImageConfigured() ? "generating" : "ready");
        session.setSelectedVariantId(variant.getVariantKey());
        session.setUpdatedAt(now);
        sessionRepository.save(session);

        if (aiProperties.isStylistImageConfigured()) {
            dispatchPreviews(List.of(variant));
        }
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

    private void reserveStylistRegenerationQuota(
            StylistSessionEntity session,
            StylistVariantEntity variant,
            AvatarSnapshotEntity avatar,
            String deviceId,
            int regenerationNumber,
            Instant now
    ) {
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
        quotaSession.setExternalProductId(stylistRegenerationQuotaExternalId(variant.getId(), regenerationNumber));
        quotaSession.setProductTitle("AI-стилист: перегенерация " + session.getPresetTitle() + " - " + variant.getTitle());
        quotaSession.setProductBrand("AI-стилист");
        quotaSession.setProductSizes("[]");
        quotaSession.setBeforeImageUrl("/api/v1/avatars/active/photo");
        quotaService.reserve(quotaSession, profile, deviceId);
        tryOnSessionRepository.save(quotaSession);
    }

    public static String stylistQuotaExternalId(UUID stylistSessionId) {
        return "stylist-quota:" + stylistSessionId;
    }

    public static String stylistRegenerationQuotaExternalId(UUID variantId, int regenerationNumber) {
        return "stylist-regenerate:" + variantId + ":" + regenerationNumber;
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
                variant(session, "classic", preset, season, imageConfigured, 0, now, 0),
                variant(session, "modern", preset, season, imageConfigured, 1, now, 0),
                variant(session, "rebel", preset, season, imageConfigured, 2, now, 0)
        );
    }

    private StylistVariantEntity variant(
            StylistSessionEntity session,
            String key,
            StylistPreset preset,
            String season,
            boolean imageConfigured,
            int sortOrder,
            Instant now,
            int regenerationNumber
    ) {
        StyleBrief brief = styleBrief(preset.id(), preset.title(), season, key, regenerationNumber);
        StylistVariantEntity variant = new StylistVariantEntity(
                UUID.randomUUID(),
                session.getId(),
                key,
                brief.title(),
                brief.summary(),
                brief.direction(),
                brief.comment(),
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
        map.put("regenerationCount", variant.getRegenerationCount());
        map.put("nextRegenerationFree", variant.getRegenerationCount() == 0);
        if (isPollinationsPreview(variant)) {
            map.put("previewStatus", "failed");
            map.put("tryOnPreviewUrl", null);
            map.put("errorCode", "AI_PROVIDER_FALLBACK_NOT_ALLOWED");
            map.put("errorMessage", "Stylist preview requires Grok Imagine; disabled image fallback is not allowed");
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

    static String productSearchQuery(StylistSessionEntity session, StylistVariantEntity variant) {
        return limitText(session.getPresetTitle()
                + ", " + session.getSeason()
                + ", " + variant.getTitle()
                + ", " + variant.getStyleDirection()
                + ", одежда обувь аксессуары", 500);
    }

    private static StyleBrief styleBrief(String presetId, String presetTitle, String season, String variantKey, int regenerationNumber) {
        int rotation = Math.floorMod(regenerationNumber, 3);
        EventStyle event = eventStyle(presetId);
        DirectionStyle direction = directionStyle(variantKey, rotation);
        String title = direction.titlePrefix() + ": " + event.titleAngle(rotation);
        String directionText = event.directionFor(variantKey, rotation)
                + ". Палитра: " + event.paletteFor(variantKey, rotation)
                + ". Фактуры и акценты: " + direction.textureFocus()
                + ". Сезонная адаптация: " + seasonalAdjustment(season)
                + ". Обязательное отличие: " + event.differenceRule(variantKey, rotation)
                + ". Не повторять универсальные шаблоны: черный жакет с базовым платьем, одинаковый брючный костюм, однотонное платье-футляр или безликий total black, если они прямо не описаны выше.";
        String summary = "Для «" + presetTitle + "»: " + event.shortSummary(variantKey, rotation);
        String comment = "Соберите образ вокруг конкретного события, а не вокруг общего дресс-кода. "
                + event.commentFor(variantKey, rotation)
                + " Визуально это должен быть самостоятельный вариант: другая формула комплекта, другая палитра, другая обувь и другой главный акцент по сравнению с соседними карточками.";
        return new StyleBrief(title, limitText(summary, 500), limitText(directionText, 480), comment);
    }

    private static EventStyle eventStyle(String presetId) {
        return switch (presetId) {
            case "date" -> new EventStyle(
                    List.of("мягкая городская романтика", "ужин с фактурным акцентом", "прогулка и коктейль"),
                    Map.of(
                            "classic", List.of("сатиновая midi-юбка, тонкий трикотажный топ, укороченный жакет, kitten heels, мини-сумка", "платье на запах с мягкой драпировкой, изящный ремень, серьги-капли, лодочки", "прямая юбка с разрезом, шелковая блуза, кардиган-жакет, аккуратные мюли"),
                            "modern", List.of("асимметричный топ, широкие брюки, лакированные slingback, крупная серьга", "платье-комбинация поверх тонкой сетчатой водолазки, короткий жакет, металлик-сумка", "драпированный лонгслив, юбка-колонна, ремень с выразительной пряжкой"),
                            "rebel", List.of("кожаная midi-юбка, полупрозрачный верх под плотный жакет, остроносые ботильоны", "красный или винный акцент, графичный топ, темный деним wide-leg, каблук", "мини-платье с плотными колготками, oversized бомбер, заметная обувь")
                    ),
                    Map.of(
                            "classic", List.of("молочный, какао, розовое дерево", "темный шоколад, шампань, пудровый", "графит, кремовый, приглушенная слива"),
                            "modern", List.of("butter yellow с серым", "ледяной голубой с бордо", "оливковый с молочным"),
                            "rebel", List.of("винный, черный, серебро", "томатный красный, графит, кожа", "черный, сливовый, лаковый акцент")
                    )
            );
            case "office" -> new EventStyle(
                    List.of("собранная деловая архитектура", "офис без скучного костюма", "профессиональный smart layer"),
                    Map.of(
                            "classic", List.of("жилет с четкой посадкой, прямые брюки, рубашка с жестким воротником, slingback, структурированная сумка", "платье-жакет до колена, тонкий ремень, закрытые лодочки", "юбка-карандаш новой длины, мягкая блуза, короткий жакет"),
                            "modern", List.of("серый трикотажный комплект поверх белой рубашки, высокий сапог или slingback, винтажная брошь", "укороченный жакет, широкие брюки с защипами, цветной ремень", "тонкая водолазка, кожаная юбка прямого кроя, строгая сумка"),
                            "rebel", List.of("темный деним без потертостей, строгий жакет с акцентными плечами, острый каблук", "графичный жилет, контрастная рубашка, лакированные лоферы", "монохром с металлической фурнитурой, асимметричная застежка, жесткая сумка")
                    ),
                    Map.of(
                            "classic", List.of("серый, белый, темно-синий", "молочный, графит, капучино", "чернильный, кремовый, taupe"),
                            "modern", List.of("серый с butter yellow", "оливковый с молочным", "бордо с холодным бежевым"),
                            "rebel", List.of("графит, черный, сталь", "темный шоколад, белый, лаковый черный", "navy, серебро, холодный серый")
                    )
            );
            case "wedding_guest" -> new EventStyle(
                    List.of("гостья без конкуренции с невестой", "праздничная драпировка", "вечерняя легкость"),
                    Map.of(
                            "classic", List.of("драпированное midi-платье без белого цвета, тонкие босоножки, клатч", "шелковый костюм с мягкими брюками palazzo, топ без лишнего блеска, серьги", "платье с открытой линией ключиц и спокойной длиной, накидка"),
                            "modern", List.of("нарядные separates: асимметричный топ и юбка-колонна, металлик-сандалии", "платье с архитектурной драпировкой и крупным цветочным акцентом", "комбинезон с мягким объемом рукава, тонкий ремень, клатч"),
                            "rebel", List.of("темный jewel-tone костюм на голое тело с деликатным топом, яркие серьги", "атласная юбка с высоким разрезом, корсетный верх, не bridal-палитра", "мини-платье с объемным бантом на плече, закрытая обувь")
                    ),
                    Map.of(
                            "classic", List.of("sage, пыльная роза, шампань без белого", "лаванда, серебро, дымчатый серый", "петроль, мягкое золото, кремовый аксессуар"),
                            "modern", List.of("ледяной голубой, серебро, какао", "butter yellow, бронза, молочный", "ягодный, графит, розовое золото"),
                            "rebel", List.of("изумруд, черный, золото", "слива, бронза, телесный", "фуксия, графит, серебро")
                    )
            );
            case "party" -> new EventStyle(
                    List.of("вечерний свет и движение", "клубная энергия без костюма", "фото-ready вечеринка"),
                    Map.of(
                            "classic", List.of("черное платье с необычной фактурой, прозрачные колготки, каблук, серьги", "сатиновый костюм с топом, мини-клатч, гладкая обувь", "юбка с мягким блеском, простой топ, укороченный жакет"),
                            "modern", List.of("пайетки в дневной форме: блестящая юбка и простой свитер, острый каблук", "металлик-топ, широкие брюки, ремень, маленькая сумка", "платье с бахромой или движением, лаконичная обувь"),
                            "rebel", List.of("кожаный низ, корсетный верх, массивные серьги, ботильоны", "контрастный total red или cobalt, графичный макияж, высокий каблук", "мини с плотным верхом, ремень-цепь, лакированная обувь")
                    ),
                    Map.of(
                            "classic", List.of("черный, шампань, сталь", "ночной синий, серебро, молочный", "слива, черный, сатин"),
                            "modern", List.of("серебро, серый, черный", "cobalt, графит, белый", "золото, какао, черный"),
                            "rebel", List.of("черный, красный, лак", "кислотный акцент, графит, сталь", "бордо, кожа, серебро")
                    )
            );
            case "vacation" -> new EventStyle(
                    List.of("курортный день без пляжного клише", "город в отпуске", "легкая travel-капсула"),
                    Map.of(
                            "classic", List.of("льняное платье-рубашка, кожаные сандалии, плетеная сумка", "прямые шорты бермуды, хлопковая рубашка, ремень, мюли", "юбка midi, майка из плотного хлопка, легкий кардиган"),
                            "modern", List.of("сетчатый верх поверх топа, свободные брюки, яркие сандалии", "жилет без рукавов, бермуды, платок, структурированная сумка", "платье с крупным принтом, плоская обувь, крупные очки"),
                            "rebel", List.of("крючковая фактура, темный деним, ремень с металлом, грубые сандалии", "яркий сет co-ord, спортивные очки, chunky jewelry", "асимметричный сарафан, контрастная обувь, большая сумка")
                    ),
                    Map.of(
                            "classic", List.of("молочный, песочный, табак", "navy, белый, карамель", "оливковый, кремовый, золото"),
                            "modern", List.of("butter yellow, небесный, белый", "коралл, хаки, молочный", "голубой, шоколад, солома"),
                            "rebel", List.of("черный, песочный, металл", "лайм, графит, белый", "терракота, темный деним, бронза")
                    )
            );
            case "photoshoot" -> new EventStyle(
                    List.of("кадр с читаемым силуэтом", "редакционная линия", "образ для сильного портрета"),
                    Map.of(
                            "classic", List.of("монохромное платье-колонна, четкая обувь, один скульптурный аксессуар", "костюм с длинной линией жакета, топ, острый нос обуви", "юбка А-силуэта и приталенный верх, широкая манжета"),
                            "modern", List.of("объемный верх и узкий низ, крупный пояс, архитектурная сумка", "полупрозрачный слой поверх базы, длинная юбка, необычная обувь", "цветной костюм с cropped jacket, минимальный топ"),
                            "rebel", List.of("графичный контраст, кожаные элементы, высокая обувь", "большой бант или бахрома, жесткая геометрия, темная палитра", "асимметричное платье, перчатки или манжеты, statement heels")
                    ),
                    Map.of(
                            "classic", List.of("ivory, графит, золото", "черный, белый, сталь", "какао, молочный, бронза"),
                            "modern", List.of("кобальт, серый, серебро", "пыльная мята, кремовый, графит", "butter yellow, черный, белый"),
                            "rebel", List.of("черный, белый, красный", "слива, лак, серебро", "графит, кожа, фуксия")
                    )
            );
            case "interview" -> new EventStyle(
                    List.of("уверенная первая встреча", "спокойная компетентность", "профессиональная четкость"),
                    Map.of(
                            "classic", List.of("жакет средней длины, прямые брюки, светлая рубашка, закрытая обувь", "платье-футляр с мягким жакетом, небольшая сумка", "юбка midi, трикотажный топ, структурированный жакет"),
                            "modern", List.of("жилет, широкие брюки, тонкая водолазка, лоферы", "монохромный комплект с укороченным жакетом, аккуратная брошь", "рубашка с интересной манжетой, прямой низ, slingback"),
                            "rebel", List.of("темный костюм с необычной застежкой, минимальный топ, строгая обувь", "графичный контраст воротника и жакета, акцентная сумка", "структурированный сарафан поверх рубашки, острые лоферы")
                    ),
                    Map.of(
                            "classic", List.of("navy, белый, серый", "графит, молочный, taupe", "темный зеленый, кремовый, шоколад"),
                            "modern", List.of("серый, butter yellow, белый", "бордо, графит, молочный", "оливковый, черный, кремовый"),
                            "rebel", List.of("черный, сталь, белый", "темный шоколад, молочный, золото", "navy, графит, серебро")
                    )
            );
            case "city_weekend" -> new EventStyle(
                    List.of("городской маршрут выходного", "кофе-галерея-встреча", "повседневный образ с характером"),
                    Map.of(
                            "classic", List.of("прямые джинсы, кардиган-жакет, лоферы, маленькая сумка", "трикотажное платье, тренч, кроссовки clean-силуэта", "юбка midi, рубашка, мягкий свитер на плечах"),
                            "modern", List.of("баррел-джинсы, укороченный жакет, балетки или mary jane", "поло из плотного трикотажа, широкие брюки, яркая сумка", "деним on denim с ремнем, slingback, очки"),
                            "rebel", List.of("кожаная куртка, юбка с принтом, грубая обувь", "широкий деним, графичный топ, бомбер, цепь", "мини-юбка с плотными колготками, oversized верх, острые ботинки")
                    ),
                    Map.of(
                            "classic", List.of("деним, молочный, карамель", "серый, navy, белый", "шоколад, кремовый, оливковый"),
                            "modern", List.of("серый, красный аксессуар, деним", "butter yellow, белый, графит", "голубой деним, какао, серебро"),
                            "rebel", List.of("черный, деним, красный", "хаки, графит, металл", "слива, черный, молочный")
                    )
            );
            default -> eventStyle("city_weekend");
        };
    }

    private static DirectionStyle directionStyle(String variantKey, int rotation) {
        return switch (variantKey) {
            case "classic" -> new DirectionStyle(
                    rotation == 1 ? "Элегантный классический" : rotation == 2 ? "Чистый классический" : "Сдержанный классический",
                    "качественная база, чистая посадка, спокойная фурнитура, современная длина"
            );
            case "modern" -> new DirectionStyle(
                    rotation == 1 ? "Трендовый современный" : rotation == 2 ? "Редакционный современный" : "Модный современный",
                    "актуальные пропорции, выразительная фактура, один свежий fashion-week акцент"
            );
            case "rebel" -> new DirectionStyle(
                    rotation == 1 ? "Смелый выразительный" : rotation == 2 ? "Острый бунтарский" : "Вызывающий бунтарский",
                    "контраст, блеск или кожа, заметная обувь, один провокационный акцент без вульгарности"
            );
            default -> new DirectionStyle("Индивидуальный образ", "сбалансированные фактуры и уместные акценты");
        };
    }

    private static String seasonalAdjustment(String season) {
        return switch (season) {
            case "зима" -> "слои, закрытая обувь, плотные ткани, верхний слой без потери силуэта";
            case "весна" -> "легкие слои, свежий цвет, закрытая или полузакрытая обувь";
            case "лето" -> "дышащие ткани, открытая обувь там, где уместно, свет без перегруза";
            case "осень" -> "структурный слой, кожа/замша/трикотаж, теплые глубокие оттенки";
            default -> "сезонные ткани и обувь, уместные погоде";
        };
    }

    private static String limitText(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 1)).stripTrailing() + "…";
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

    private record StyleBrief(String title, String summary, String direction, String comment) {
    }

    private record DirectionStyle(String titlePrefix, String textureFocus) {
    }

    private record EventStyle(List<String> angles, Map<String, List<String>> formulas, Map<String, List<String>> palettes) {
        String titleAngle(int rotation) {
            return pick(angles, rotation);
        }

        String shortSummary(String variantKey, int rotation) {
            return pick(formulas.get(variantKey), rotation);
        }

        String directionFor(String variantKey, int rotation) {
            return "Формула комплекта: " + pick(formulas.get(variantKey), rotation);
        }

        String paletteFor(String variantKey, int rotation) {
            return pick(palettes.get(variantKey), rotation);
        }

        String differenceRule(String variantKey, int rotation) {
            return switch (variantKey) {
                case "classic" -> rotation == 0
                        ? "делать ставку на посадку и дорогую простоту, без вечернего блеска"
                        : "оставить сдержанность, но сменить силуэт и цветовую температуру";
                case "modern" -> rotation == 0
                        ? "использовать современную пропорцию или layering, а не тот же классический комплект"
                        : "выбрать новый трендовый акцент, не повторяя обувь и главный предмет";
                case "rebel" -> rotation == 0
                        ? "добавить остроту через материал, обувь или цвет, сохранив уместность события"
                        : "сделать образ заметно смелее, но не копировать клубный total black";
                default -> "собрать самостоятельную формулу комплекта";
            };
        }

        String commentFor(String variantKey, int rotation) {
            return switch (variantKey) {
                case "classic" -> "Классика здесь не должна быть одинаковым офисным костюмом: пусть работает точная длина, ткань и спокойный аксессуар.";
                case "modern" -> "Современность лучше показать пропорцией, цветом сезона или необычным слоем, а не случайной яркой вещью.";
                case "rebel" -> "Смелость держится на одном сильном приеме, поэтому остальные элементы должны поддерживать силуэт и не спорить с событием.";
                default -> "Вариант должен выглядеть покупаемо и применимо в реальной жизни.";
            } + " Ротация идеи: " + (rotation + 1) + ".";
        }

        private static String pick(List<String> values, int rotation) {
            if (values == null || values.isEmpty()) {
                return "индивидуальная формула образа";
            }
            return values.get(Math.floorMod(rotation, values.size()));
        }
    }

    private record AiTextContext(String avatarAnalysis, String trendNote) {
    }
}
