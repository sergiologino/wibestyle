package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record BillingWebhookRequest(
        @NotBlank String event,
        UUID checkoutId,
        String externalPaymentId
) {
}
