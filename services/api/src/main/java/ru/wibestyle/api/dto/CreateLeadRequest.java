package ru.wibestyle.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

public record CreateLeadRequest(
        String name,
        @NotBlank String phoneOrEmail,
        String gender,
        String favoriteMarketplace,
        String interest,
        String page,
        String utmSource,
        String utmCampaign,
        String referrer,
        @AssertTrue boolean consent
) {
}
