package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 32) String login,
        @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String captchaId,
        @NotBlank String captchaAnswer,
        @Size(max = 80) String displayName
) {
}
