package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AiProviderErrorMappingRequest(
        @NotBlank @Size(max = 1000) String errorText,
        @NotBlank @Size(max = 1500) String description,
        @NotNull Boolean enabled
) {
}
