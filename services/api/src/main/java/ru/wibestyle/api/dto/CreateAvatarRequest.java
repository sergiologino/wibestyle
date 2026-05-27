package ru.wibestyle.api.dto;

public record CreateAvatarRequest(
        Boolean privacyFaceHidden,
        Boolean privacyBackgroundHidden,
        Boolean privacyFeaturesHidden
) {
}
