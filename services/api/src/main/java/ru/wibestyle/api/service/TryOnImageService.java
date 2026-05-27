package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class TryOnImageService {

    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final LocalStorageService localStorageService;
    private final RestClient restClient;

    public TryOnImageService(
            AvatarSnapshotRepository avatarSnapshotRepository,
            LocalStorageService localStorageService,
            RestClient.Builder restClientBuilder
    ) {
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.localStorageService = localStorageService;
        this.restClient = restClientBuilder.build();
    }

    public Optional<AvatarSnapshotEntity> findSnapshot(TryOnSessionEntity session) {
        if (session.getAvatarSnapshotId() == null) {
            return Optional.empty();
        }
        return avatarSnapshotRepository.findById(session.getAvatarSnapshotId());
    }

    public String resolveBeforeImageUrl(TryOnSessionEntity session) {
        return findSnapshot(session)
                .map(snapshot -> "/api/v1/avatars/" + snapshot.getAvatarId() + "/photo?variant=processed")
                .orElse("/assets/demo-before.svg");
    }

    public String encodePersonImageBase64(TryOnSessionEntity session) throws IOException {
        AvatarSnapshotEntity snapshot = findSnapshot(session)
                .orElseThrow(() -> new IOException("Avatar snapshot not found"));
        String path = snapshot.getProcessedImagePath();
        if (path == null || !localStorageService.exists(path)) {
            throw new IOException("Avatar processed image missing");
        }
        return Base64.getEncoder().encodeToString(localStorageService.readBytes(path));
    }

    public String encodeGarmentImageBase64(TryOnSessionEntity session) throws IOException {
        String path = session.getGarmentPhotoPath();
        if (path != null && localStorageService.exists(path)) {
            return Base64.getEncoder().encodeToString(localStorageService.readBytes(path));
        }
        String imageUrl = session.getProductImageUrl();
        if (imageUrl != null && imageUrl.startsWith("http")) {
            byte[] bytes = restClient.get().uri(URI.create(imageUrl)).retrieve().body(byte[].class);
            if (bytes != null && bytes.length > 0) {
                return Base64.getEncoder().encodeToString(bytes);
            }
        }
        throw new IOException("Garment image missing");
    }

    public String persistRemoteResult(UUID userId, UUID sessionId, String remoteUrl) throws IOException {
        byte[] bytes = restClient.get().uri(URI.create(remoteUrl)).retrieve().body(byte[].class);
        if (bytes == null || bytes.length == 0) {
            throw new IOException("Empty AI result image");
        }
        return localStorageService.storeTryOnResult(userId, sessionId, "after", new ByteArrayInputStream(bytes));
    }
}
