package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CompleteUploadRequest(
        @NotNull UUID assetId,
        @NotBlank String uploadToken
) {
}
