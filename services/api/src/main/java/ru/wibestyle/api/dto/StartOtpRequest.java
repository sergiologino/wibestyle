package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record StartOtpRequest(@NotBlank String phone, String captchaId, String captchaAnswer) {
}
