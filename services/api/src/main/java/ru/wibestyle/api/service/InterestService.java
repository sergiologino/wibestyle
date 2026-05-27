package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.LandingInterestEntity;
import ru.wibestyle.api.dto.CreateInterestRequest;
import ru.wibestyle.api.repository.LandingInterestRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class InterestService {

    private final LandingInterestRepository landingInterestRepository;

    public InterestService(LandingInterestRepository landingInterestRepository) {
        this.landingInterestRepository = landingInterestRepository;
    }

    public Map<String, Object> register(CreateInterestRequest request) {
        if (!request.consent()) {
            throw new IllegalArgumentException("CONSENT_REQUIRED");
        }

        LandingInterestEntity entity = new LandingInterestEntity(
                UUID.randomUUID(),
                request.emailOrPhone().trim(),
                request.interest(),
                request.page(),
                request.utmSource(),
                request.utmCampaign(),
                request.referrer(),
                true,
                Instant.now()
        );
        landingInterestRepository.save(entity);

        return Map.of(
                "id", entity.getId().toString(),
                "emailOrPhone", entity.getEmailOrPhone(),
                "interest", entity.getInterest() == null ? "" : entity.getInterest(),
                "createdAt", entity.getCreatedAt().toString()
        );
    }
}
