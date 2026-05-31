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

        return (faceLock + "\n\n" + core + "\n\n" + faceLock).trim();

    }



    /** Base text only (for admin preview). */

    public String buildBasePrompt() {

        return promptTemplateService.getBodyOrDefault(

                AiPromptTemplateService.VTON_BASE_RU_KEY,

                DEFAULT_VTON_BASE_RU

        ).trim();

    }

}


