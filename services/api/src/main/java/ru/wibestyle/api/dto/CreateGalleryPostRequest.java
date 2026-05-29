package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateGalleryPostRequest(
        UUID tryOnSessionId,
        @NotBlank String visibility,
        String title,
        String description,
        String imageUrl,
        Boolean productLinkVisible,
        String productVisibility,
        String marketplace,
        String productUrl,
        String productTitle,
        Boolean eliteFrame,
        String mediaType
) {
}
