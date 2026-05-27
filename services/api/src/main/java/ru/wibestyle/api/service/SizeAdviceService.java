package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.ai.GarmentFitAnalyzer;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.SizeAdviceRequest;
import ru.wibestyle.api.marketplace.MarketplaceAdapter;
import ru.wibestyle.api.marketplace.MarketplaceAdapterRegistry;
import ru.wibestyle.api.marketplace.ProductDetails;
import ru.wibestyle.api.marketplace.ProductSizeChart;
import ru.wibestyle.api.repository.UserProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SizeAdviceService {

    private final UserProfileRepository userProfileRepository;
    private final FeatureFlagsProperties featureFlagsProperties;
    private final GarmentFitAnalyzer garmentFitAnalyzer;
    private final ObjectMapper objectMapper;
    private final MarketplaceAdapterRegistry marketplaceAdapterRegistry;

    public SizeAdviceService(
            UserProfileRepository userProfileRepository,
            FeatureFlagsProperties featureFlagsProperties,
            GarmentFitAnalyzer garmentFitAnalyzer,
            ObjectMapper objectMapper,
            MarketplaceAdapterRegistry marketplaceAdapterRegistry
    ) {
        this.userProfileRepository = userProfileRepository;
        this.featureFlagsProperties = featureFlagsProperties;
        this.garmentFitAnalyzer = garmentFitAnalyzer;
        this.objectMapper = objectMapper;
        this.marketplaceAdapterRegistry = marketplaceAdapterRegistry;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> advise(UUID userId, SizeAdviceRequest request) {
        if (!featureFlagsProperties.isEnabled("sizeAdvisory")) {
            throw new IllegalArgumentException("SIZE_ADVISORY_DISABLED");
        }

        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));

        List<String> warnings = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        List<String> reviewSignals = request.reviewSignals() == null ? List.of() : request.reviewSignals();

        if (request.availableSizes() != null && !request.availableSizes().contains(request.selectedSize())) {
            warnings.add("SIZE_NOT_AVAILABLE");
            reasons.add("Выбранный размер отсутствует в карточке товара.");
        }

        if (reviewSignals.contains("runs_small") || reviewSignals.contains("small")) {
            warnings.add("RUNS_SMALL");
            reasons.add("В отзывах часто пишут, что товар маломерит. Проверь размерную сетку перед покупкой.");
        }

        ProductSizeChart chart = resolveProductSizeChart(request);
        GarmentFitAnalyzer.GarmentFitAssessment fit = garmentFitAnalyzer.analyze(
                adviceSession(request),
                adviceSnapshot(profile),
                chart
        );
        if ("too_small".equals(fit.status()) || "tight".equals(fit.status())) {
            warnings.add("SIZE_MAY_BE_TIGHT");
            reasons.add("По вашей фигуре (грудь/бёдра и привычный размер) маркировка "
                    + request.selectedSize() + " может быть мала.");
            if (fit.recommendedSize() != null) {
                reasons.add("Лучше начать с размера " + fit.recommendedSize() + ".");
            }
        }

        String status = warnings.isEmpty() ? "ok" : "warning";
        double confidence = warnings.isEmpty() ? 0.82 : 0.64;
        String recommendedSize = fit.recommendedSize() != null
                ? fit.recommendedSize()
                : recommendSize(profile, request.availableSizes(), request.selectedSize());

        Map<String, Object> advice = new HashMap<>();
        advice.put("status", status);
        advice.put("recommendedSize", recommendedSize);
        advice.put("selectedSize", request.selectedSize());
        advice.put("confidence", confidence);
        advice.put("warnings", warnings);
        advice.put("reasons", reasons);
        advice.put("reviewSignals", reviewSignals);
        return Map.of("advice", advice);
    }

    private ProductSizeChart resolveProductSizeChart(SizeAdviceRequest request) {
        if (request.productUrl() == null || request.productUrl().isBlank()) {
            return ProductSizeChart.empty();
        }
        try {
            MarketplaceAdapter adapter = marketplaceAdapterRegistry.resolve(request.productUrl());
            ProductDetails product = adapter.fetchProduct(request.externalProductId(), request.productUrl());
            return product.sizeChart() == null ? ProductSizeChart.empty() : product.sizeChart();
        } catch (RuntimeException ex) {
            return ProductSizeChart.empty();
        }
    }

    private TryOnSessionEntity adviceSession(SizeAdviceRequest request) {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.DRAFT,
                java.time.Instant.now(),
                java.time.Instant.now()
        );
        session.setSelectedSize(request.selectedSize());
        try {
            session.setProductSizes(objectMapper.writeValueAsString(
                    request.availableSizes() == null ? List.of() : request.availableSizes()
            ));
        } catch (Exception ex) {
            session.setProductSizes("[]");
        }
        return session;
    }

    private static AvatarSnapshotEntity adviceSnapshot(UserProfileEntity profile) {
        return new AvatarSnapshotEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                profile.getUserId(),
                profile.getHeightCm(),
                profile.getBustCm(),
                profile.getWaistCm(),
                profile.getHipsCm(),
                null,
                profile.getClothingSize(),
                null,
                false,
                false,
                false,
                null,
                "advice",
                java.time.Instant.now()
        );
    }

    private String recommendSize(UserProfileEntity profile, List<String> availableSizes, String selectedSize) {
        if (availableSizes == null || availableSizes.isEmpty()) {
            return selectedSize;
        }
        if (profile.getBustCm() == null) {
            return selectedSize;
        }
        if (profile.getBustCm() > 96 && availableSizes.contains("L")) return "L";
        if (profile.getBustCm() > 88 && availableSizes.contains("M")) return "M";
        return selectedSize;
    }
}
