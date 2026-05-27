package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateReviewDisplayNameRequest(
        @NotBlank @Size(max = 120) String displayName
) {
}
