package ru.wibestyle.api.dto;

import java.util.Map;

public record UpdatePlatformSettingsRequest(
        Boolean blockGoogleOAuth,
        Boolean tryOnScenesEnabled,
        Boolean tryOnPoseChangeEnabled,
        Map<String, String> tryOnScenePrompts
) {
}
