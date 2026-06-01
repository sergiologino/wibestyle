package ru.wibestyle.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.config.StorageProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.storage.LocalBlobStorage;

import java.nio.file.Files;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TryOnStoredMediaServiceTest {

    @TempDir
    java.nio.file.Path tempDir;

    private LocalBlobStorage blobStorage;
    private TryOnStoredMediaService service;
    private UUID userId;
    private UUID sessionId;

    @BeforeEach
    void setUp() throws Exception {
        StorageProperties properties = new StorageProperties();
        properties.setRoot(tempDir.toString());
        blobStorage = new LocalBlobStorage(properties);
        ReflectionTestUtils.invokeMethod(blobStorage, "init");
        service = new TryOnStoredMediaService(blobStorage, RestClient.builder());
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    void resolveAfterPhotoUsesCanonicalBlobKeyNotApiUrlInDatabase() throws Exception {
        byte[] bytes = new byte[] {1, 2, 3};
        blobStorage.storeTryOnResult(userId, sessionId, "after", new java.io.ByteArrayInputStream(bytes));

        TryOnSessionEntity session = sessionWithAfterUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        TryOnStoredMediaService.ResolvedMedia resolved = service.resolveAfterPhoto(userId, sessionId, session);

        assertInstanceOf(TryOnStoredMediaService.ResolvedMedia.Stored.class, resolved);
        assertTrue(Files.exists(((TryOnStoredMediaService.ResolvedMedia.Stored) resolved).media().path()));
    }

    @Test
    void resolveAfterPhotoFallsBackToGarmentWhenAfterMissing() throws Exception {
        String garmentKey = blobStorage.storeGarmentPhoto(
                userId,
                sessionId,
                ".webp",
                new java.io.ByteArrayInputStream(new byte[] {9, 9, 9})
        );

        TryOnSessionEntity session = sessionWithAfterUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        session.setGarmentPhotoPath(garmentKey);

        TryOnStoredMediaService.ResolvedMedia resolved = service.resolveAfterPhoto(userId, sessionId, session);

        assertInstanceOf(TryOnStoredMediaService.ResolvedMedia.Stored.class, resolved);
    }

    private TryOnSessionEntity sessionWithAfterUrl(String afterUrl) {
        TryOnSessionEntity session = new TryOnSessionEntity(
                sessionId,
                userId,
                null,
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.READY,
                Instant.now(),
                Instant.now()
        );
        session.setAfterImageUrl(afterUrl);
        return session;
    }
}
