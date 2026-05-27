package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank String identifier,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String captchaId,
        @NotBlank String captchaAnswer
) {
}
