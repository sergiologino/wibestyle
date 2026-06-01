package ru.wibestyle.api.service;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

/** Resolves try-on preview files from blob storage (canonical keys + legacy refs). */
@Service
public class TryOnStoredMediaService {

    public record StoredMedia(Path path, MediaType contentType) {
    }

    public record RemoteMedia(byte[] bytes, MediaType contentType) {
    }

    public sealed interface ResolvedMedia permits ResolvedMedia.Stored, ResolvedMedia.Remote, ResolvedMedia.Missing {
        record Stored(StoredMedia media) implements ResolvedMedia {
        }

        record Remote(RemoteMedia media) implements ResolvedMedia {
        }

        record Missing() implements ResolvedMedia {
        }
    }

    private final BlobStorage blobStorage;
    private final RestClient restClient;

    public TryOnStoredMediaService(BlobStorage blobStorage, RestClient.Builder restClientBuilder) {
        this.blobStorage = blobStorage;
        this.restClient = restClientBuilder.build();
    }

    public ResolvedMedia resolveAfterPhoto(UUID userId, UUID sessionId, TryOnSessionEntity session) {
        Optional<StoredMedia> stored = resolveStoredAfterPhoto(userId, sessionId);
        if (stored.isPresent()) {
            return new ResolvedMedia.Stored(stored.get());
        }
        Optional<StoredMedia> garment = resolveStoredGarmentPhoto(session);
        if (garment.isPresent()) {
            return new ResolvedMedia.Stored(garment.get());
        }
        Optional<RemoteMedia> remote = resolveRemoteAfterPhoto(session);
        if (remote.isPresent()) {
            return new ResolvedMedia.Remote(remote.get());
        }
        return new ResolvedMedia.Missing();
    }

    public ResolvedMedia resolveGarmentPhoto(TryOnSessionEntity session) {
        Optional<StoredMedia> garment = resolveStoredGarmentPhoto(session);
        if (garment.isPresent()) {
            return new ResolvedMedia.Stored(garment.get());
        }
        return new ResolvedMedia.Missing();
    }

    public Optional<StoredMedia> resolveStoredAfterPhoto(UUID userId, UUID sessionId) {
        String canonical = blobStorage.keyTryOnResult(userId, sessionId, "after");
        return toStoredMedia(canonical);
    }

    public Optional<StoredMedia> resolveStoredGarmentPhoto(TryOnSessionEntity session) {
        String path = session.getGarmentPhotoPath();
        if (path == null || path.isBlank()) {
            return Optional.empty();
        }
        return toStoredMedia(path);
    }

    public Optional<RemoteMedia> resolveRemoteAfterPhoto(TryOnSessionEntity session) {
        String url = session.getAfterImageUrl();
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return Optional.empty();
        }
        try {
            byte[] bytes = restClient.get().uri(URI.create(url)).retrieve().body(byte[].class);
            if (bytes == null || bytes.length == 0) {
                return Optional.empty();
            }
            return Optional.of(new RemoteMedia(bytes, MediaType.IMAGE_JPEG));
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    private Optional<StoredMedia> toStoredMedia(String keyOrLegacyRef) {
        if (keyOrLegacyRef == null || keyOrLegacyRef.isBlank() || !blobStorage.exists(keyOrLegacyRef)) {
            return Optional.empty();
        }
        try {
            Path path = blobStorage.resolveLocalFile(keyOrLegacyRef);
            String contentType = Files.probeContentType(path);
            MediaType mediaType = contentType == null
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(contentType);
            return Optional.of(new StoredMedia(path, mediaType));
        } catch (IOException ex) {
            return Optional.empty();
        }
    }
}
