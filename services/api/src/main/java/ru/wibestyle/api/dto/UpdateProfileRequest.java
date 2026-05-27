package ru.wibestyle.api.dto;

public record UpdateProfileRequest(
        String displayName,
        String gender,
        Integer heightCm,
        Integer weightKg,
        Integer bustCm,
        Integer waistCm,
        Integer hipsCm,
        Integer shoeSizeEu,
        String clothingSize,
        String profileType,
        String sizingSystem,
        Boolean privacyFaceHidden,
        Boolean privacyBackgroundHidden,
        Boolean privacyFeaturesHidden
) {
}
