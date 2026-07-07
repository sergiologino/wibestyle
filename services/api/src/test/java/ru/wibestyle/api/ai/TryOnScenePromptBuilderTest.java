package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.service.PlatformSettingsService;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TryOnScenePromptBuilderTest {

    @Mock
    private PlatformSettingsService settingsService;

    @Test
    void selectsSleepwearSceneAndAllowsOnlySmallPoseChange() {
        TryOnSessionEntity session = session("sleepwear", "homewear_safe", "Шёлковый пеньюар");
        when(settingsService.isTryOnScenesEnabled()).thenReturn(true);
        when(settingsService.isTryOnPoseChangeEnabled()).thenReturn(true);
        when(settingsService.getTryOnScenePrompts()).thenReturn(Map.of(
                "sleepwear", "a tasteful bedroom\na refined dressing room",
                "default", "a neutral interior"
        ));

        TryOnScenePromptBuilder builder = new TryOnScenePromptBuilder(settingsService);
        String prompt = builder.build(session);

        assertThat(TryOnScenePromptBuilder.resolveSceneKey(session)).isEqualTo("sleepwear");
        assertThat(prompt).containsAnyOf("a tasteful bedroom", "a refined dressing room");
        assertThat(builder.build(session)).isEqualTo(prompt);
        assertThat(prompt).contains("slightly change");
        assertThat(prompt).contains("body shape and anthropometry");
    }

    @Test
    void disabledScenesKeepOriginalBackgroundAndPose() {
        TryOnSessionEntity session = session("jacket", "outerwear", "Пальто");
        when(settingsService.isTryOnScenesEnabled()).thenReturn(false);

        String prompt = new TryOnScenePromptBuilder(settingsService).build(session);

        assertThat(prompt).contains("keep the original image1 background and pose");
    }

    @Test
    void detectsOfficeAndSportswearFromTitle() {
        assertThat(TryOnScenePromptBuilder.resolveSceneKey(
                session("top", "standard", "Деловой офисный блейзер")
        )).isEqualTo("office");
        assertThat(TryOnScenePromptBuilder.resolveSceneKey(
                session("top", "standard", "Спортивный костюм для фитнеса")
        )).isEqualTo("sportswear");
    }

    private static TryOnSessionEntity session(String category, String profile, String title) {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.GARMENT_PHOTO,
                TryOnSessionStatus.GENERATING,
                Instant.now(),
                Instant.now()
        );
        session.setGarmentCategory(category);
        session.setGarmentPromptProfile(profile);
        session.setProductTitle(title);
        return session;
    }
}
