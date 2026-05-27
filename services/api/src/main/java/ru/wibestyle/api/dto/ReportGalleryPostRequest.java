package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportGalleryPostRequest(
        @NotBlank String reason,
        @Size(max = 1000) String details
) {
}
