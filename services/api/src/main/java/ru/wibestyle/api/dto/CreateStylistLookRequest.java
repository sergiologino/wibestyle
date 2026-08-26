package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStylistLookRequest(
        @NotBlank @Size(max = 64) String presetId
) {
}
