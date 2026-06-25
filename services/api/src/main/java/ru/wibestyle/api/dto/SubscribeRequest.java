package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SubscribeRequest(
        @NotBlank String plan,
        @NotBlank String period,
        Boolean savePaymentMethod,
        String client
) {
    public boolean shouldSavePaymentMethod() {
        return Boolean.TRUE.equals(savePaymentMethod);
    }

    public boolean isMobileClient() {
        return "mobile".equalsIgnoreCase(client);
    }
}
