package ru.wibestyle.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.domain.TryOnJobEntity;
import ru.wibestyle.api.repository.TryOnJobRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.service.AiTryOnService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/jobs")
public class AiJobController {

    private final TryOnJobRepository tryOnJobRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final AiTryOnService aiTryOnService;

    public AiJobController(
            TryOnJobRepository tryOnJobRepository,
            TryOnSessionRepository tryOnSessionRepository,
            AiTryOnService aiTryOnService
    ) {
        this.tryOnJobRepository = tryOnJobRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.aiTryOnService = aiTryOnService;
    }

    @GetMapping("/{jobId}")
    public Map<String, Object> getJob(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID jobId
    ) {
        UUID userId = requireUserId(authorization);
        TryOnJobEntity job = tryOnJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        tryOnSessionRepository.findByIdAndUserId(job.getSessionId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));

        return Map.of("job", aiTryOnService.toJobMap(job));
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }
}
