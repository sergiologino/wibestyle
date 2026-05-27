package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateInterestRequest(
        @NotBlank String emailOrPhone,
        String interest,
        String page,
        String utmSource,
        String utmCampaign,
        String referrer,
        boolean consent
) {
}
