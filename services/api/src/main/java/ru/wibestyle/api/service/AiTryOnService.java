package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiJobStatus;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.QueueNames;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.domain.TryOnJobEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.repository.TryOnJobRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AiTryOnService {

    private final TryOnJobRepository tryOnJobRepository;
    private final TryOnJobWorker tryOnJobWorker;
    private final AiIntegrationProperties aiProperties;

    public AiTryOnService(
            TryOnJobRepository tryOnJobRepository,
            TryOnJobWorker tryOnJobWorker,
            AiIntegrationProperties aiProperties
    ) {
        this.tryOnJobRepository = tryOnJobRepository;
        this.tryOnJobWorker = tryOnJobWorker;
        this.aiProperties = aiProperties;
    }

    @Transactional
    public TryOnJobEntity enqueuePhotoTryOn(TryOnSessionEntity session) {
        String idempotencyKey = idempotencyKey(session.getId());
        return tryOnJobRepository.findByIdempotencyKey(idempotencyKey)
                .orElseGet(() -> createJob(session, idempotencyKey));
    }

    public void dispatch(TryOnJobEntity job) {
        UUID jobId = job.getId();
        if (!aiProperties.isAsyncEnabled()) {
            tryOnJobWorker.process(jobId);
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    tryOnJobWorker.processAsync(jobId);
                }
            });
            return;
        }
        tryOnJobWorker.processAsync(jobId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> toJobMap(TryOnJobEntity job) {
        Map<String, Object> map = new HashMap<>();
        map.put("jobId", job.getId().toString());
        map.put("sessionId", job.getSessionId().toString());
        map.put("operation", job.getOperation());
        map.put("queueName", job.getQueueName());
        map.put("status", job.getAiStatus() == null ? job.getStatus() : job.getAiStatus().name());
        map.put("provider", job.getProvider());
        map.put("durationMs", job.getDurationMs());
        map.put("errorCode", job.getErrorCode());
        map.put("idempotencyKey", job.getIdempotencyKey());
        map.put("externalRequestId", job.getExternalRequestId());
        map.put("priority", job.getPriority());
        map.put("createdAt", job.getCreatedAt().toString());
        map.put("updatedAt", job.getUpdatedAt().toString());
        return map;
    }

    public void ensureProductImageOrFail(TryOnSessionEntity session) {
        if (session.getGarmentPhotoPath() == null
                && (session.getProductImageUrl() == null || session.getProductImageUrl().isBlank())) {
            throw new IllegalArgumentException(TryOnErrorCodes.PRODUCT_IMAGE_NOT_FOUND);
        }
    }

    public static String idempotencyKey(UUID sessionId) {
        return "tryon:" + sessionId + ":photo:front:v1";
    }

    private TryOnJobEntity createJob(TryOnSessionEntity session, String idempotencyKey) {
        Instant now = Instant.now();
        TryOnJobEntity job = new TryOnJobEntity(
                UUID.randomUUID(),
                session.getId(),
                QueueNames.AI_TRYON_PHOTO,
                "queued",
                aiProperties.isNoteappConfigured() ? "noteapp-ai" : "demo-stub",
                now,
                now
        );
        job.setOperation(AiOperations.VIRTUAL_TRY_ON_PHOTO);
        job.setIdempotencyKey(idempotencyKey);
        job.setAiStatus(AiJobStatus.QUEUED);
        job.setPriority("normal");
        return tryOnJobRepository.save(job);
    }
}
