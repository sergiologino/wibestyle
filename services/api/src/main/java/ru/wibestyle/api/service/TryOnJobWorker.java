package ru.wibestyle.api.service;



import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.scheduling.annotation.Async;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import ru.wibestyle.api.ai.GarmentFitAnalyzer;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.ai.SizeComplimentService;
import ru.wibestyle.api.ai.VirtualTryOnPromptBuilder;
import ru.wibestyle.api.marketplace.ProductSizeChart;
import ru.wibestyle.api.marketplace.ProductSizeChartJson;

import ru.wibestyle.api.config.AiIntegrationProperties;

import ru.wibestyle.api.domain.AiJobStatus;

import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import ru.wibestyle.api.domain.AiOperations;

import ru.wibestyle.api.domain.TryOnErrorCodes;

import ru.wibestyle.api.domain.TryOnJobEntity;

import ru.wibestyle.api.domain.TryOnSessionEntity;

import ru.wibestyle.api.domain.TryOnSessionStatus;

import ru.wibestyle.api.repository.TryOnJobRepository;

import ru.wibestyle.api.repository.TryOnSessionRepository;

import ru.wibestyle.api.repository.UserProfileRepository;



import java.io.IOException;
import java.time.Instant;

import java.util.HashMap;

import java.util.List;

import java.util.Map;

import java.util.UUID;



@Service

public class TryOnJobWorker {



    private static final Logger log = LoggerFactory.getLogger(TryOnJobWorker.class);

    private static final String DEMO_AFTER = "/assets/demo-after.svg";



    private final TryOnJobRepository tryOnJobRepository;

    private final TryOnSessionRepository tryOnSessionRepository;

    private final NoteappAiClient noteappAiClient;

    private final VirtualTryOnPromptBuilder promptBuilder;

    private final AiIntegrationProperties aiProperties;

    private final QuotaService quotaService;

    private final TryOnImageService tryOnImageService;

    private final GarmentImageService garmentImageService;

    private final AiIntegrationLogService aiIntegrationLogService;

    private final GarmentFitAnalyzer garmentFitAnalyzer;

    private final SizeComplimentService sizeComplimentService;

    private final UserProfileRepository userProfileRepository;

    private final ObjectMapper objectMapper;

    private final AiProviderPriorityService aiProviderPriorityService;



    public TryOnJobWorker(

            TryOnJobRepository tryOnJobRepository,

            TryOnSessionRepository tryOnSessionRepository,

            NoteappAiClient noteappAiClient,

            VirtualTryOnPromptBuilder promptBuilder,

            AiIntegrationProperties aiProperties,

            QuotaService quotaService,

            TryOnImageService tryOnImageService,

            GarmentImageService garmentImageService,

            AiIntegrationLogService aiIntegrationLogService,

            GarmentFitAnalyzer garmentFitAnalyzer,

            SizeComplimentService sizeComplimentService,

            UserProfileRepository userProfileRepository,

            ObjectMapper objectMapper,

            AiProviderPriorityService aiProviderPriorityService

    ) {

        this.tryOnJobRepository = tryOnJobRepository;

        this.tryOnSessionRepository = tryOnSessionRepository;

        this.noteappAiClient = noteappAiClient;

        this.promptBuilder = promptBuilder;

        this.aiProperties = aiProperties;

        this.quotaService = quotaService;

        this.tryOnImageService = tryOnImageService;

        this.garmentImageService = garmentImageService;

        this.aiIntegrationLogService = aiIntegrationLogService;

        this.garmentFitAnalyzer = garmentFitAnalyzer;

        this.sizeComplimentService = sizeComplimentService;

        this.userProfileRepository = userProfileRepository;

        this.objectMapper = objectMapper;

        this.aiProviderPriorityService = aiProviderPriorityService;

    }



    @Async("aiTaskExecutor")

    public void processAsync(UUID jobId) {

        process(jobId);

    }



    public void process(UUID jobId) {
        TryOnJobEntity job = tryOnJobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return;
        }

        TryOnSessionEntity session = tryOnSessionRepository.findById(job.getSessionId()).orElse(null);
        if (session == null) {
            markJobFailed(job, TryOnErrorCodes.SESSION_NOT_FOUND, "Session not found");
            return;
        }

        try {
            runJob(job, session);
        } catch (Exception ex) {
            log.error("Try-on job {} failed unexpectedly", jobId, ex);
            markFailed(session, job, TryOnErrorCodes.AI_GENERATION_FAILED, ex.getMessage());
            tryOnSessionRepository.save(session);
        }
    }

    private void runJob(TryOnJobEntity job, TryOnSessionEntity session) {



        if (!hasProductImage(session)) {

            markFailed(session, job, TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND, "Product image not found");

            return;

        }



        job.setAiStatus(AiJobStatus.RUNNING);

        job.setStatus("running");

        job.setUpdatedAt(Instant.now());

        tryOnJobRepository.save(job);



        long started = System.currentTimeMillis();

        try {

            garmentImageService.ensureLocalGarmentPhoto(session.getUserId(), session);

        } catch (Exception ex) {

            log.warn("Could not cache garment photo for session {}: {}", session.getId(), ex.getMessage());

        }



        session.setBeforeImageUrl(tryOnImageService.resolveBeforeImageUrl(session));

        session.setUpdatedAt(Instant.now());



        NoteappAiClient.ProcessResult aiResult = callAi(session);

        if (aiResult.success()) {

            completeSuccess(session, job, aiResult, started);

            quotaService.consume(session);

            tryOnSessionRepository.save(session);

            return;

        }



        if (aiProperties.isFallbackToDemo()
                && !TryOnErrorCodes.VTON_CONTENT_MODERATION.equals(aiResult.errorCode())) {

            log.info("AI failed for session {}, falling back to demo assets: {}", session.getId(), aiResult.errorCode());

            job.setAiStatus(AiJobStatus.FALLBACK_RUNNING);

            job.setUpdatedAt(Instant.now());

            tryOnJobRepository.save(job);

            completeDemo(session, job, started);

            quotaService.consume(session);

            tryOnSessionRepository.save(session);

            return;

        }



        markFailed(session, job, aiResult.errorCode(), aiResult.errorMessage());
        tryOnSessionRepository.save(session);
    }



    private NoteappAiClient.ProcessResult callAi(TryOnSessionEntity session) {

        if (!aiProperties.isIntegrationConfigured()) {
            aiIntegrationLogService.logSkipped(session, "WIBESTYLE_AI_ENABLED/API_KEY/TRYON_NETWORK не настроены");
            return NoteappAiClient.ProcessResult.failed("AI_NOT_CONFIGURED", "AI service not configured");

        }



        String prompt = promptBuilder.buildPrompt(session);

        String personImageBase64 = null;

        String garmentImageBase64 = null;

        try {

            personImageBase64 = tryOnImageService.encodePersonImageBase64(session);

            garmentImageBase64 = tryOnImageService.encodeGarmentImageBase64(session);

        } catch (Exception ex) {

            log.warn("Try-on image encoding failed for session {}: {}", session.getId(), ex.getMessage());
            aiIntegrationLogService.logSkipped(session, "не удалось закодировать фото: " + ex.getMessage());

            return NoteappAiClient.ProcessResult.failed("AI_GENERATION_FAILED", ex.getMessage());

        }



        Map<String, String> metadata = new HashMap<>();

        metadata.put("operation", AiOperations.VIRTUAL_TRY_ON_PHOTO);

        metadata.put("sessionId", session.getId().toString());

        metadata.put("garmentCategory", nullSafe(session.getGarmentCategory()));

        metadata.put("productImageUrl", nullSafe(session.getProductImageUrl()));



        AvatarSnapshotEntity avatarSnapshot = tryOnImageService.findSnapshot(session).orElse(null);

        // figureLock / fitHint / product data уже внутри prompt (база из админки + JSON-блок).
        List<AiProviderPriorityService.ProviderRoute> routes =
                aiProviderPriorityService.routeFor(AiOperations.VIRTUAL_TRY_ON_PHOTO);
        NoteappAiClient.ProcessResult lastResult =
                NoteappAiClient.ProcessResult.failed("AI_NOT_CONFIGURED", "AI provider route is empty");
        String fallbackReason = null;
        for (int i = 0; i < routes.size(); i++) {
            AiProviderPriorityService.ProviderRoute route = routes.get(i);
            lastResult = noteappAiClient.processVirtualTryOn(
                    route.networkName(),
                    i + 1,
                    fallbackReason,
                    session,
                    prompt,
                    personImageBase64,
                    garmentImageBase64,
                    metadata,
                    avatarSnapshot,
                    null,
                    null
            );
            if (lastResult.success()) {
                return lastResult;
            }
            if (i + 1 >= routes.size() || !aiProviderPriorityService.shouldFallback(lastResult.errorCode())) {
                return lastResult;
            }
            fallbackReason = AiProviderPriorityService.fallbackReason(lastResult.errorCode(), lastResult.errorMessage());
            log.info(
                    "AI provider {} failed for session {}, fallback to next provider: {}",
                    route.networkName(),
                    session.getId(),
                    fallbackReason
            );
        }
        return lastResult;

    }



    private void completeSuccess(

            TryOnSessionEntity session,

            TryOnJobEntity job,

            NoteappAiClient.ProcessResult aiResult,

            long started

    ) {

        String afterUrl = aiResult.imageUrl();

        try {
            if (aiResult.imageBytes() != null && aiResult.imageBytes().length > 0) {
                tryOnImageService.persistResultBytes(session.getUserId(), session.getId(), aiResult.imageBytes());
            } else if (aiResult.imageUrl() != null && !aiResult.imageUrl().isBlank()) {
                tryOnImageService.persistRemoteResult(session.getUserId(), session.getId(), aiResult.imageUrl());
            } else {
                throw new IOException("AI result has no image bytes or URL");
            }
            afterUrl = "/api/v1/try-on/sessions/" + session.getId() + "/after-photo";
        } catch (Exception ex) {
            log.warn("Could not persist AI result locally, using remote URL: {}", ex.getMessage());
        }



        session.setAfterImageUrl(afterUrl);

        session.setStatus(TryOnSessionStatus.READY);

        session.setUpdatedAt(Instant.now());

        applySizeFitAdvice(session);
        applyResultCompliment(session);



        job.setProvider(aiResult.provider());

        job.setExternalRequestId(aiResult.requestId());

        job.setAiStatus(AiJobStatus.SUCCEEDED);

        job.setStatus("completed");

        job.setDurationMs((int) (System.currentTimeMillis() - started));

        job.setUpdatedAt(Instant.now());



        tryOnSessionRepository.save(session);

        tryOnJobRepository.save(job);

    }



    private void completeDemo(TryOnSessionEntity session, TryOnJobEntity job, long started) {

        session.setAfterImageUrl(DEMO_AFTER);

        session.setStatus(TryOnSessionStatus.READY);

        session.setUpdatedAt(Instant.now());

        applySizeFitAdvice(session);
        applyResultCompliment(session);



        job.setProvider("demo-fallback");

        job.setAiStatus(AiJobStatus.SUCCEEDED);

        job.setStatus("completed");

        job.setDurationMs((int) (System.currentTimeMillis() - started));

        job.setUpdatedAt(Instant.now());



        tryOnSessionRepository.save(session);

        tryOnJobRepository.save(job);

    }



    private void markFailed(TryOnSessionEntity session, TryOnJobEntity job, String errorCode, String message) {

        session.setStatus(TryOnSessionStatus.FAILED);

        session.setErrorCode(errorCode);

        session.setErrorMessage(message);

        session.setUpdatedAt(Instant.now());



        job.setAiStatus(AiJobStatus.FAILED);

        job.setStatus("failed");

        job.setErrorCode(errorCode);

        job.setUpdatedAt(Instant.now());



        quotaService.refund(session);

        tryOnSessionRepository.save(session);

        tryOnJobRepository.save(job);

    }



    private void markJobFailed(TryOnJobEntity job, String errorCode, String message) {

        job.setAiStatus(AiJobStatus.FAILED);

        job.setStatus("failed");

        job.setErrorCode(errorCode);

        job.setUpdatedAt(Instant.now());

        tryOnJobRepository.save(job);

    }



    private boolean hasProductImage(TryOnSessionEntity session) {

        return session.getGarmentPhotoPath() != null

                || (session.getProductImageUrl() != null && !session.getProductImageUrl().isBlank());

    }



    private void applySizeFitAdvice(TryOnSessionEntity session) {
        AvatarSnapshotEntity snapshot = tryOnImageService.findSnapshot(session).orElse(null);
        if (snapshot == null) {
            return;
        }
        ProductSizeChart chart = ProductSizeChartJson.deserialize(objectMapper, session.getProductSizeChart());
        GarmentFitAnalyzer.GarmentFitAssessment assessment = garmentFitAnalyzer.analyze(session, snapshot, chart);
        session.setSizeFitStatus(assessment.status());
        session.setRecommendedSize(assessment.recommendedSize());
        if (assessment.suggestAlternateSize()) {
            session.setSizeFitMessage(sizeComplimentService.buildSuggestion(session.getId(), assessment, snapshot));
        } else {
            session.setSizeFitMessage(null);
        }
    }

    private void applyResultCompliment(TryOnSessionEntity session) {
        AvatarSnapshotEntity snapshot = tryOnImageService.findSnapshot(session).orElse(null);
        if (snapshot == null) {
            session.setStyleCompliment(null);
            return;
        }
        ProductSizeChart chart = ProductSizeChartJson.deserialize(objectMapper, session.getProductSizeChart());
        GarmentFitAnalyzer.GarmentFitAssessment assessment = garmentFitAnalyzer.analyze(session, snapshot, chart);
        String plan = userProfileRepository.findById(session.getUserId())
                .map(profile -> profile.getPlan())
                .orElse("trial");
        session.setStyleCompliment(sizeComplimentService.buildResultCompliment(session, assessment, snapshot, plan));
    }



    private static String nullSafe(String value) {

        return value == null ? "" : value;

    }

}


