package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.domain.AiJobStatus;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.QueueNames;
import ru.wibestyle.api.domain.TryOnJobEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.repository.TryOnJobRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SeasonHitVideoService {

    private final TryOnJobRepository tryOnJobRepository;
    private final FeatureFlagsProperties featureFlagsProperties;
    private final AiIntegrationProperties aiProperties;
    private final SeasonHitVideoJobWorker seasonHitVideoJobWorker;
    private final TrialVideoQuotaService trialVideoQuotaService;

    public SeasonHitVideoService(
            TryOnJobRepository tryOnJobRepository,
            FeatureFlagsProperties featureFlagsProperties,
            AiIntegrationProperties aiProperties,
            SeasonHitVideoJobWorker seasonHitVideoJobWorker,
            TrialVideoQuotaService trialVideoQuotaService
    ) {
        this.tryOnJobRepository = tryOnJobRepository;
        this.featureFlagsProperties = featureFlagsProperties;
        this.aiProperties = aiProperties;
        this.seasonHitVideoJobWorker = seasonHitVideoJobWorker;
        this.trialVideoQuotaService = trialVideoQuotaService;
    }

    @Transactional
    public Map<String, Object> generateVideo(UUID userId, TryOnSessionEntity session) {
        if (session.getStatus() != TryOnSessionStatus.READY) {
            throw new IllegalArgumentException("SESSION_NOT_READY");
        }
        if (session.getAfterImageUrl() == null || session.getAfterImageUrl().isBlank()) {
            throw new IllegalArgumentException("AFTER_IMAGE_NOT_FOUND");
        }

        String videoStatus = session.getVideoStatus() == null ? "none" : session.getVideoStatus();
        if ("ready".equals(videoStatus) && session.getAfterVideoUrl() != null) {
            return Map.of(
                    "sessionId", session.getId().toString(),
                    "videoStatus", "ready",
                    "afterVideoUrl", session.getAfterVideoUrl()
            );
        }
        if ("generating".equals(videoStatus)) {
            return Map.of(
                    "sessionId", session.getId().toString(),
                    "videoStatus", "generating"
            );
        }

        if (!featureFlagsProperties.isEnabled("videoTryOn")) {
            throw new IllegalArgumentException("FEATURE_DISABLED");
        }

        trialVideoQuotaService.reserve(userId, session);
        session.setVideoStatus("generating");
        session.setVideoErrorCode(null);
        session.setVideoErrorMessage(null);
        session.setUpdatedAt(Instant.now());

        TryOnJobEntity job = enqueueVideoJob(session);
        dispatch(job);

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId().toString());
        response.put("videoStatus", "generating");
        response.put("jobId", job.getId().toString());
        return response;
    }

    private TryOnJobEntity enqueueVideoJob(TryOnSessionEntity session) {
        String idempotencyKey = "tryon:" + session.getId() + ":season-video:v1";
        return tryOnJobRepository.findByIdempotencyKey(idempotencyKey)
                .orElseGet(() -> createJob(session, idempotencyKey));
    }

    private TryOnJobEntity createJob(TryOnSessionEntity session, String idempotencyKey) {
        Instant now = Instant.now();
        TryOnJobEntity job = new TryOnJobEntity(
                UUID.randomUUID(),
                session.getId(),
                QueueNames.AI_TRYON_VIDEO,
                "queued",
                aiProperties.isSeasonVideoConfigured() ? "noteapp-ai" : "demo-stub",
                now,
                now
        );
        job.setOperation(AiOperations.VIRTUAL_TRY_ON_VIDEO);
        job.setIdempotencyKey(idempotencyKey);
        job.setAiStatus(AiJobStatus.QUEUED);
        job.setPriority("normal");
        return tryOnJobRepository.save(job);
    }

    private void dispatch(TryOnJobEntity job) {
        UUID jobId = job.getId();
        if (!aiProperties.isAsyncEnabled()) {
            seasonHitVideoJobWorker.process(jobId);
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    seasonHitVideoJobWorker.processAsync(jobId);
                }
            });
            return;
        }
        seasonHitVideoJobWorker.processAsync(jobId);
    }
}
