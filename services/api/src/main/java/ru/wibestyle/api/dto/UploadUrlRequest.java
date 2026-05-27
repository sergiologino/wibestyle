package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UploadUrlRequest(
        @NotBlank String purpose,
        String contentType
) {
}
