package ru.wibestyle.api.dto;

import java.time.Instant;

public record AdminSubscriptionPatchRequest(
        String plan,
        Integer trialGenerationsLeft,
        Integer planGenerationsLeft,
        Integer additionalGenerations,
        String billingPeriod,
        Instant subscriptionExpiresAt
) {
}
