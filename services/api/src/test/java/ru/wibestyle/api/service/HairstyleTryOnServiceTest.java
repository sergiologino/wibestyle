package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.ai.HairstylePromptBuilder;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.domain.UserProfileEntity;

import java.io.InputStream;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class HairstyleTryOnServiceTest {
    @Test
    void sendsHairColorReferenceAsThirdImageWhenStyleAndColorSelected() throws Exception {
        UUID userId = UUID.randomUUID();
        NoteappAiClient aiClient = mock(NoteappAiClient.class);
        BlobStorage storage = mock(BlobStorage.class);
        HairstyleCatalogRepository hairstyles = mock(HairstyleCatalogRepository.class);
        HairColorCatalogRepository colors = mock(HairColorCatalogRepository.class);
        TryOnSessionRepository sessions = mock(TryOnSessionRepository.class);
        UserActivityService activity = mock(UserActivityService.class);
        QuotaService quotaService = mock(QuotaService.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        AiIntegrationProperties ai = new AiIntegrationProperties();
        ai.setEnabled(true);
        ai.setApiKey("test-key");
        ai.setVirtualTryOnNetwork("hair-network");
        byte[] portrait = new byte[]{1};
        byte[] styleReference = new byte[]{2};
        byte[] colorReference = new byte[]{3};
        when(storage.exists(BlobKeys.hairstylePortrait(userId))).thenReturn(true);
        when(storage.readBytes(BlobKeys.hairstylePortrait(userId))).thenReturn(portrait);
        when(storage.readBytes("catalog/hairstyles/bixie.jpg")).thenReturn(styleReference);
        when(storage.readBytes("catalog/hair-colors/red-coral.jpg")).thenReturn(colorReference);
        when(hairstyles.findBySlug("bixie")).thenReturn(Optional.of(hairstyle()));
        when(colors.findBySlug("red-coral")).thenReturn(Optional.of(hairColor()));
        when(profiles.findById(userId)).thenReturn(Optional.of(profile));
        when(aiClient.applyHairstyle(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new NoteappAiClient.AvatarEnhancementResult(new byte[]{4}, "image/jpeg"));

        new HairstyleTryOnService(
                aiClient,
                ai,
                storage,
                new HairstylePromptBuilder(),
                hairstyles,
                colors,
                sessions,
                activity,
                quotaService,
                profiles,
                users
        ).generate(userId, null, "bixie", "red-coral");

        verify(aiClient).applyHairstyle(
                eq("hair-network"),
                startsWith(userId + ":hairstyle:"),
                eq(Base64.getEncoder().encodeToString(portrait)),
                eq(Base64.getEncoder().encodeToString(styleReference)),
                eq(Base64.getEncoder().encodeToString(colorReference)),
                contains("COLOR TO APPLY")
        );
        verify(quotaService).reserve(any(), eq(profile));
        verify(quotaService).consume(any());
    }

    @Test
    void tryOnSessionHairstyleKeepsOriginalAvatarAsBeforeImage() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sourceSessionId = UUID.randomUUID();
        NoteappAiClient aiClient = mock(NoteappAiClient.class);
        BlobStorage storage = mock(BlobStorage.class);
        HairstyleCatalogRepository hairstyles = mock(HairstyleCatalogRepository.class);
        HairColorCatalogRepository colors = mock(HairColorCatalogRepository.class);
        TryOnSessionRepository sessions = mock(TryOnSessionRepository.class);
        UserActivityService activity = mock(UserActivityService.class);
        QuotaService quotaService = mock(QuotaService.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        UserEntity user = new UserEntity(userId, "+79990000000", Instant.now());
        user.setStylistFocusGroup(true);
        TryOnSessionEntity sourceSession = new TryOnSessionEntity(
                sourceSessionId,
                userId,
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.READY,
                Instant.now(),
                Instant.now()
        );
        sourceSession.setBeforeImageUrl("/api/v1/try-on/sessions/" + sourceSessionId + "/before-photo");
        sourceSession.setAfterImageUrl("/api/v1/try-on/sessions/" + sourceSessionId + "/after-photo");
        AiIntegrationProperties ai = new AiIntegrationProperties();
        ai.setEnabled(true);
        ai.setApiKey("test-key");
        ai.setVirtualTryOnNetwork("hair-network");
        String sourceAfterKey = "source-after-key";
        String sourceBeforeKey = "source-before-key";
        byte[] sourceAfter = new byte[]{9};
        byte[] sourceBefore = new byte[]{8};
        AtomicReference<byte[]> storedBefore = new AtomicReference<>();
        byte[] portrait = new byte[]{1};
        byte[] styleReference = new byte[]{2};
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(sessions.findByIdAndUserId(sourceSessionId, userId)).thenReturn(Optional.of(sourceSession));
        when(storage.keyTryOnResult(userId, sourceSessionId, "after")).thenReturn(sourceAfterKey);
        when(storage.keyTryOnResult(userId, sourceSessionId, "before")).thenReturn(sourceBeforeKey);
        when(storage.exists(sourceAfterKey)).thenReturn(true);
        when(storage.exists(sourceBeforeKey)).thenReturn(true);
        when(storage.exists(BlobKeys.hairstylePortrait(userId))).thenReturn(true);
        when(storage.readBytes(sourceAfterKey)).thenReturn(sourceAfter);
        when(storage.readBytes(sourceBeforeKey)).thenReturn(sourceBefore);
        when(storage.readBytes(BlobKeys.hairstylePortrait(userId))).thenReturn(portrait);
        when(storage.readBytes("catalog/hairstyles/bixie.jpg")).thenReturn(styleReference);
        when(hairstyles.findBySlug("bixie")).thenReturn(Optional.of(hairstyle()));
        when(profiles.findById(userId)).thenReturn(Optional.of(profile));
        when(aiClient.applyHairstyleToTryOnResult(anyString(), anyString(), anyString(), anyString(), anyString(), isNull(), anyString()))
                .thenReturn(new NoteappAiClient.AvatarEnhancementResult(new byte[]{4}, "image/jpeg"));
        doAnswer(invocation -> {
            InputStream input = invocation.getArgument(3);
            storedBefore.set(input.readAllBytes());
            return null;
        }).when(storage).storeTryOnResult(eq(userId), any(UUID.class), eq("before"), any(InputStream.class));

        new HairstyleTryOnService(
                aiClient,
                ai,
                storage,
                new HairstylePromptBuilder(),
                hairstyles,
                colors,
                sessions,
                activity,
                quotaService,
                profiles,
                users
        ).generateForTryOnSession(userId, sourceSessionId, "bixie", null);

        verify(aiClient).applyHairstyleToTryOnResult(
                eq("hair-network"),
                startsWith(userId + ":tryon-hairstyle:"),
                eq(Base64.getEncoder().encodeToString(sourceAfter)),
                eq(Base64.getEncoder().encodeToString(portrait)),
                eq(Base64.getEncoder().encodeToString(styleReference)),
                isNull(),
                contains("Never output the hairstyle catalogue model")
        );
        assertThat(storedBefore.get()).isEqualTo(sourceBefore);
    }

    @Test
    void comboPromptLocksTryOnResultAsOnlyCanvas() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sourceSessionId = UUID.randomUUID();
        NoteappAiClient aiClient = mock(NoteappAiClient.class);
        BlobStorage storage = mock(BlobStorage.class);
        HairstyleCatalogRepository hairstyles = mock(HairstyleCatalogRepository.class);
        HairColorCatalogRepository colors = mock(HairColorCatalogRepository.class);
        TryOnSessionRepository sessions = mock(TryOnSessionRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        UserEntity user = new UserEntity(userId, "+79990000000", Instant.now());
        user.setStylistFocusGroup(true);
        TryOnSessionEntity sourceSession = new TryOnSessionEntity(
                sourceSessionId,
                userId,
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.READY,
                Instant.now(),
                Instant.now()
        );
        AiIntegrationProperties ai = new AiIntegrationProperties();
        ai.setEnabled(true);
        ai.setApiKey("test-key");
        ai.setVirtualTryOnNetwork("hair-network");
        String sourceAfterKey = "source-after-key";
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(sessions.findByIdAndUserId(sourceSessionId, userId)).thenReturn(Optional.of(sourceSession));
        when(storage.keyTryOnResult(userId, sourceSessionId, "after")).thenReturn(sourceAfterKey);
        when(storage.keyTryOnResult(userId, sourceSessionId, "before")).thenReturn("source-before-key");
        when(storage.exists(sourceAfterKey)).thenReturn(true);
        when(storage.exists(BlobKeys.hairstylePortrait(userId))).thenReturn(true);
        when(storage.readBytes(sourceAfterKey)).thenReturn(new byte[]{9});
        when(storage.readBytes(BlobKeys.hairstylePortrait(userId))).thenReturn(new byte[]{1});
        when(storage.readBytes("catalog/hairstyles/bixie.jpg")).thenReturn(new byte[]{2});
        when(storage.readBytes("catalog/hair-colors/red-coral.jpg")).thenReturn(new byte[]{3});
        when(hairstyles.findBySlug("bixie")).thenReturn(Optional.of(hairstyle()));
        when(colors.findBySlug("red-coral")).thenReturn(Optional.of(hairColor()));
        when(profiles.findById(userId)).thenReturn(Optional.of(profile));
        when(aiClient.applyHairstyleToTryOnResult(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new NoteappAiClient.AvatarEnhancementResult(new byte[]{4}, "image/jpeg"));

        new HairstyleTryOnService(
                aiClient,
                ai,
                storage,
                new HairstylePromptBuilder(),
                hairstyles,
                colors,
                sessions,
                mock(UserActivityService.class),
                mock(QuotaService.class),
                profiles,
                users
        ).generateForTryOnSession(userId, sourceSessionId, "bixie", "red-coral");

        verify(aiClient).applyHairstyleToTryOnResult(
                eq("hair-network"),
                startsWith(userId + ":tryon-hairstyle:"),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                argThat(prompt -> prompt.contains("OUTPUT CANVAS LOCK")
                        && prompt.contains("image 1 is the final canvas")
                        && prompt.contains("Never use a reference image as the base image")
                        && !prompt.contains("single close-up portrait"))
        );
    }

    private static HairstyleCatalogEntity hairstyle() {
        return new HairstyleCatalogEntity(
                UUID.randomUUID(),
                "bixie",
                "Бикси",
                "Короткая форма",
                "short",
                "Подойдет для овала",
                "apply bixie haircut",
                "catalog/hairstyles/bixie.jpg",
                1,
                Instant.now()
        );
    }

    private static HairColorCatalogEntity hairColor() {
        return new HairColorCatalogEntity(
                UUID.randomUUID(),
                "red-coral",
                "6.60 Красный коралл",
                "Красные",
                "Оттенок Garnier Color Sensation.",
                "change only hair color to red coral",
                "catalog/hair-colors/red-coral.jpg",
                "Garnier",
                "https://www.garnier.ru/hair-color/beauty/garnier/color-sensation/6-60-krasnyj-korall",
                "Фото оттенков взяты из публичного каталога Garnier. Правообладатель: Garnier.",
                12,
                Instant.now()
        );
    }
}
