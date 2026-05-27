package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateLinkTryOnSessionRequest(
        @NotBlank String url,
        String selectedSize
) {
}
