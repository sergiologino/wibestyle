package ru.wibestyle.api.ai;



import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Component;

import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import ru.wibestyle.api.domain.TryOnSessionEntity;

import ru.wibestyle.api.marketplace.ProductSizeChart;

import ru.wibestyle.api.marketplace.ProductSizeChartJson;

import ru.wibestyle.api.repository.AvatarSnapshotRepository;

import ru.wibestyle.api.service.AiPromptTemplateService;



@Component

public class VirtualTryOnPromptBuilder {



    static final String DEFAULT_VTON_BASE_RU = """

            Виртуальная примерка одежды для интернет-магазина (как на Wildberries/Ozon).

            На фото image1 — покупатель: единственный источник лица, волос, тона кожи и фигуры.

            На фото image2 — товар с карточки маркетплейса (часто с моделью в одежде).

            С image2 возьми только одежду; лицо и тело модели на image2 не использовать.

            Одень человека с image1 в вещь с image2. Лицо, причёска и пропорции тела — строго с image1.

            Фотореализм, нейтральный студийный фон, вертикаль 3:4, PG-каталог, не эротика.

            """.trim().replaceAll("\\s+", " ");



    private static final String VARIABLES_HEADER = "\n\n--- ДАННЫЕ ПРИМЕРКИ (JSON, добавляет система) ---\n";



    private final AvatarSnapshotRepository avatarSnapshotRepository;

    private final GarmentFitAnalyzer garmentFitAnalyzer;

    private final ObjectMapper objectMapper;

    private final AiPromptTemplateService promptTemplateService;



    public VirtualTryOnPromptBuilder(

            AvatarSnapshotRepository avatarSnapshotRepository,

            GarmentFitAnalyzer garmentFitAnalyzer,

            ObjectMapper objectMapper,

            AiPromptTemplateService promptTemplateService

    ) {

        this.avatarSnapshotRepository = avatarSnapshotRepository;

        this.garmentFitAnalyzer = garmentFitAnalyzer;

        this.objectMapper = objectMapper;

        this.promptTemplateService = promptTemplateService;

    }



    public String buildPrompt(TryOnSessionEntity session) {

        AvatarSnapshotEntity snapshot = session.getAvatarSnapshotId() == null

                ? null

                : avatarSnapshotRepository.findById(session.getAvatarSnapshotId()).orElse(null);



        ProductSizeChart chart = ProductSizeChartJson.deserialize(objectMapper, session.getProductSizeChart());

        String faceLock = FaceLockPromptBuilder.build();
        String promptProfile = profileInstructions(session);

        String figureLock = FigureLockPromptBuilder.build(snapshot, session.getSelectedSize(), chart);

        String fitHint = snapshot == null

                ? ""

                : garmentFitAnalyzer.analyze(session, snapshot, chart).fitPromptHint();



        String base = promptTemplateService.getBodyOrDefault(

                AiPromptTemplateService.VTON_BASE_RU_KEY,

                DEFAULT_VTON_BASE_RU

        );

        String variablesJson = TryOnPromptVariablesBuilder.buildJsonBlock(

                objectMapper,

                session,

                snapshot,

                faceLock,

                figureLock,

                fitHint,

                chart

        );

        String core = base.trim() + VARIABLES_HEADER + variablesJson;

        return (faceLock + "\n\n" + promptProfile + "\n\n" + core + "\n\n" + promptProfile + "\n\n" + faceLock).trim();

    }



    /** Base text only (for admin preview). */

    public String buildBasePrompt() {

        return promptTemplateService.getBodyOrDefault(

                AiPromptTemplateService.VTON_BASE_RU_KEY,

                DEFAULT_VTON_BASE_RU

        ).trim();

    }

    private static String profileInstructions(TryOnSessionEntity session) {
        String profile = GarmentClassification.normalizePromptProfile(
                session.getGarmentPromptProfile(),
                session.getGarmentCategory()
        );
        String category = GarmentClassification.normalizeCategory(session.getGarmentCategory());
        String modelLock = session.isGarmentHasHumanModel()
                ? "The product image contains a seller model/mannequin. Treat that person as a non-human garment stand: do not copy their face, head, hair, skin tone, age, pose, body proportions, hands or legs."
                : "If the product image contains any seller model/mannequin, ignore the person completely and extract only the garment.";
        String base = """
                PROMPT PROFILE: %s. Garment category: %s. %s
                Identity priority: image1 is the only source for face, head, hair, skin tone, body proportions, height impression and pose.
                Product priority: image2 is only a garment/material/color/detail reference. Never duplicate the seller model from image2.
                If image1 and image2 conflict, preserve image1 identity and body and adapt only the clothing.
                """.formatted(profile, category, modelLock);
        String profileSpecific = switch (profile) {
            case "dress" -> "For dresses: preserve the customer's waist, bust, hips, shoulder line and leg length from image1; fit the dress naturally without slimming or replacing the body.";
            case "outerwear" -> "For outerwear: layer the garment over the customer's body from image1; keep the original head, neck, hands and stance.";
            case "bottom" -> "For bottoms: preserve torso, waist, hips and leg proportions from image1; only replace the lower garment.";
            case "shoes" -> "For shoes: preserve the customer's body and outfit from image1; replace only footwear, keeping foot orientation realistic.";
            case "accessory" -> "For accessories: preserve the customer's outfit and body from image1; add only the accessory from image2.";
            case "revealing_safe" -> "For underwear or swimwear: create PG catalog-safe fitted clothing, neutral studio pose, non-erotic styling, adult customer, no nudity, no sexualized framing; preserve image1 body proportions.";
            case "homewear_safe" -> "For sleepwear/homewear: create modest PG homewear styling, neutral pose, non-erotic catalog look; preserve image1 identity and proportions.";
            default -> "For standard clothing: replace only the garment while preserving the customer from image1.";
        };
        return (base + "\n" + profileSpecific).trim().replaceAll("\\s+", " ");
    }

}


