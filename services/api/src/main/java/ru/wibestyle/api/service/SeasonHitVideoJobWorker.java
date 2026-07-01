package ru.wibestyle.api.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.ai.SeasonHitVideoPromptBuilder;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiJobStatus;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.QueueNames;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.domain.TryOnJobEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.repository.TryOnJobRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SeasonHitVideoJobWorker {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SeasonHitVideoJobWorker.class);

    private final TryOnJobRepository tryOnJobRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final NoteappAiClient noteappAiClient;
    private final SeasonHitVideoPromptBuilder promptBuilder;
    private final TryOnImageService tryOnImageService;
    private final AiIntegrationProperties aiProperties;
    private final AiIntegrationLogService aiIntegrationLogService;
    private final AiProviderPriorityService aiProviderPriorityService;
    private final TrialVideoQuotaService trialVideoQuotaService;

    public SeasonHitVideoJobWorker(
            TryOnJobRepository tryOnJobRepository,
            TryOnSessionRepository tryOnSessionRepository,
            NoteappAiClient noteappAiClient,
            SeasonHitVideoPromptBuilder promptBuilder,
            TryOnImageService tryOnImageService,
            AiIntegrationProperties aiProperties,
            AiIntegrationLogService aiIntegrationLogService,
            AiProviderPriorityService aiProviderPriorityService,
            TrialVideoQuotaService trialVideoQuotaService
    ) {
        this.tryOnJobRepository = tryOnJobRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.noteappAiClient = noteappAiClient;
        this.promptBuilder = promptBuilder;
        this.tryOnImageService = tryOnImageService;
        this.aiProperties = aiProperties;
        this.aiIntegrationLogService = aiIntegrationLogService;
        this.aiProviderPriorityService = aiProviderPriorityService;
        this.trialVideoQuotaService = trialVideoQuotaService;
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
            log.error("Season hit video job {} failed unexpectedly", jobId, ex);
            markVideoFailed(session, job, TryOnErrorCodes.AI_GENERATION_FAILED, ex.getMessage());
            trialVideoQuotaService.refund(session);
            tryOnSessionRepository.save(session);
        }
    }

    private void runJob(TryOnJobEntity job, TryOnSessionEntity session) throws IOException {
        long started = System.currentTimeMillis();
        job.setAiStatus(AiJobStatus.RUNNING);
        job.setStatus("running");
        job.setUpdatedAt(Instant.now());
        tryOnJobRepository.save(job);

        session.setVideoStatus("generating");
        session.setVideoErrorCode(null);
        session.setVideoErrorMessage(null);
        session.setUpdatedAt(Instant.now());
        tryOnSessionRepository.save(session);

        NoteappAiClient.VideoProcessResult aiResult = callAi(session);
        if (!aiResult.success()) {
            markVideoFailed(session, job, aiResult.errorCode(), aiResult.errorMessage());
            trialVideoQuotaService.refund(session);
            tryOnSessionRepository.save(session);
            return;
        }

        try {
            if (aiResult.videoBytes() != null && aiResult.videoBytes().length > 0) {
                tryOnImageService.persistVideoBytes(session.getUserId(), session.getId(), aiResult.videoBytes());
            } else {
                throw new IOException("AI result has no video bytes");
            }
        } catch (IOException ex) {
            markVideoFailed(session, job, TryOnErrorCodes.AI_GENERATION_FAILED, ex.getMessage());
            trialVideoQuotaService.refund(session);
            tryOnSessionRepository.save(session);
            return;
        }

        String videoUrl = "/api/v1/try-on/sessions/" + session.getId() + "/after-video";
        session.setAfterVideoUrl(videoUrl);
        session.setVideoStatus("ready");
        session.setUpdatedAt(Instant.now());

        job.setAiStatus(AiJobStatus.SUCCEEDED);
        job.setStatus("completed");
        job.setProvider(aiResult.provider());
        job.setExternalRequestId(aiResult.requestId());
        job.setDurationMs((int) (System.currentTimeMillis() - started));
        job.setUpdatedAt(Instant.now());

        trialVideoQuotaService.consume(session);
        tryOnJobRepository.save(job);
        tryOnSessionRepository.save(session);
    }

    private NoteappAiClient.VideoProcessResult callAi(TryOnSessionEntity session) throws IOException {
        if (!aiProperties.isIntegrationConfigured()) {
            aiIntegrationLogService.logSkipped(session, "season video network not configured");
            return NoteappAiClient.VideoProcessResult.failed("AI_NOT_CONFIGURED", "Season video AI not configured");
        }

        String sourceImageBase64 = tryOnImageService.encodeAfterImageBase64(session);
        String prompt = promptBuilder.buildPrompt(session.getGarmentCategory(), session.getProductTitle());

        Map<String, String> metadata = new HashMap<>();
        metadata.put("operation", AiOperations.VIRTUAL_TRY_ON_VIDEO);
        metadata.put("sessionId", session.getId().toString());

        List<AiProviderPriorityService.ProviderRoute> routes =
                aiProviderPriorityService.routeFor(AiOperations.VIRTUAL_TRY_ON_VIDEO);
        NoteappAiClient.VideoProcessResult lastResult =
                NoteappAiClient.VideoProcessResult.failed("AI_NOT_CONFIGURED", "AI provider route is empty");
        String fallbackReason = null;
        for (int i = 0; i < routes.size(); i++) {
            AiProviderPriorityService.ProviderRoute route = routes.get(i);
            lastResult = noteappAiClient.generateSeasonHitVideo(
                    route.networkName(),
                    i + 1,
                    fallbackReason,
                    session,
                    prompt,
                    sourceImageBase64,
                    metadata
            );
            if (lastResult.success()) {
                return lastResult;
            }
            if (i + 1 >= routes.size() || !aiProviderPriorityService.shouldFallback(lastResult.errorCode())) {
                return lastResult;
            }
            fallbackReason = AiProviderPriorityService.fallbackReason(lastResult.errorCode(), lastResult.errorMessage());
            log.info(
                    "AI video provider {} failed for session {}, fallback to next provider: {}",
                    route.networkName(),
                    session.getId(),
                    fallbackReason
            );
        }
        return lastResult;
    }

    private void markVideoFailed(TryOnSessionEntity session, TryOnJobEntity job, String errorCode, String errorMessage) {
        session.setVideoStatus("failed");
        session.setVideoErrorCode(errorCode);
        session.setVideoErrorMessage(errorMessage);
        session.setUpdatedAt(Instant.now());
        markJobFailed(job, errorCode, errorMessage);
    }

    private void markJobFailed(TryOnJobEntity job, String errorCode, String errorMessage) {
        job.setAiStatus(AiJobStatus.FAILED);
        job.setStatus("failed");
        job.setErrorCode(errorCode);
        job.setUpdatedAt(Instant.now());
        tryOnJobRepository.save(job);
    }
}
