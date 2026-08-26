package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.ai.HairstylePromptBuilder;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;

import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

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
                activity
        ).generate(userId, null, "bixie", "red-coral");

        verify(aiClient).applyHairstyle(
                eq("hair-network"),
                startsWith(userId + ":hairstyle:"),
                eq(Base64.getEncoder().encodeToString(portrait)),
                eq(Base64.getEncoder().encodeToString(styleReference)),
                eq(Base64.getEncoder().encodeToString(colorReference)),
                contains("COLOR TO APPLY")
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
