package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyOtpRequest(@NotBlank String requestId, @NotBlank String code, String promoCode, String referralCode) {
}
