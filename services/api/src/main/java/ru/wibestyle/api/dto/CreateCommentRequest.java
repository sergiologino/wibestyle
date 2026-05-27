package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank String body
) {
}
