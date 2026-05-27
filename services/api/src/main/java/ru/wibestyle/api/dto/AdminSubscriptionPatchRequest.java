package ru.wibestyle.api.dto;

import java.time.Instant;

public record AdminSubscriptionPatchRequest(
        String plan,
        Integer trialGenerationsLeft,
        Integer planGenerationsLeft,
        String billingPeriod,
        Instant subscriptionExpiresAt
) {
}
