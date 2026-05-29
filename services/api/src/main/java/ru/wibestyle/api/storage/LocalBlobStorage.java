package ru.wibestyle.api.storage;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.config.StorageProperties;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "wibestyle.storage.backend", havingValue = "local", matchIfMissing = true)
public class LocalBlobStorage implements BlobStorage {

    private final StorageProperties storageProperties;
    private Path rootPath;

    public LocalBlobStorage(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    void init() throws IOException {
        rootPath = StorageRootResolver.resolveRoot(storageProperties.getRoot());
        Files.createDirectories(rootPath);
    }

    Path rootPath() {
        return rootPath;
    }

    @Override
    public String put(String key, InputStream input) throws IOException {
        Path target = resolvePhysicalPath(normalizeKey(key));
        Files.createDirectories(target.getParent());
        Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        return normalizeKey(key);
    }

    @Override
    public String putFile(String key, Path source) throws IOException {
        Path target = resolvePhysicalPath(normalizeKey(key));
        Files.createDirectories(target.getParent());
        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
        return normalizeKey(key);
    }

    @Override
    public byte[] readBytes(String keyOrLegacyRef) throws IOException {
        return Files.readAllBytes(resolvePhysicalPath(keyOrLegacyRef));
    }

    @Override
    public boolean exists(String keyOrLegacyRef) {
        if (keyOrLegacyRef == null || keyOrLegacyRef.isBlank()) {
            return false;
        }
        return Files.exists(resolvePhysicalPath(keyOrLegacyRef));
    }

    @Override
    public Path resolveLocalFile(String keyOrLegacyRef) {
        return resolvePhysicalPath(keyOrLegacyRef);
    }

    @Override
    public void deletePrefix(String prefix) throws IOException {
        Path dir = resolvePhysicalPath(normalizeKey(prefix));
        if (!Files.exists(dir)) {
            return;
        }
        deleteDirectoryTree(dir);
    }

    @Override
    public String storeAvatarOriginal(UUID userId, UUID avatarId, String extension, InputStream input) throws IOException {
        return put(BlobKeys.avatarOriginal(userId, avatarId, extension), input);
    }

    @Override
    public String storeAvatarProcessed(UUID userId, UUID avatarId, Path source) throws IOException {
        return putFile(BlobKeys.avatarProcessed(userId, avatarId), source);
    }

    @Override
    public String storeGarmentPhoto(UUID userId, UUID sessionId, String extension, InputStream input) throws IOException {
        return put(BlobKeys.tryOnGarment(userId, sessionId, extension), input);
    }

    @Override
    public String storeTryOnResult(UUID userId, UUID sessionId, String variant, InputStream input) throws IOException {
        return put(BlobKeys.tryOnResult(userId, sessionId, variant), input);
    }

    @Override
    public String storeTryOnVideo(UUID userId, UUID sessionId, InputStream input) throws IOException {
        return put(BlobKeys.tryOnVideo(userId, sessionId), input);
    }

    @Override
    public String storeMediaAsset(UUID userId, UUID assetId, String extension, InputStream input) throws IOException {
        return put(BlobKeys.mediaAsset(userId, assetId, extension), input);
    }

    @Override
    public String keyTryOnResult(UUID userId, UUID sessionId, String variant) {
        return BlobKeys.tryOnResult(userId, sessionId, variant);
    }

    @Override
    public String keyTryOnVideo(UUID userId, UUID sessionId) {
        return BlobKeys.tryOnVideo(userId, sessionId);
    }

    @Override
    public void deleteUserData(UUID userId) throws IOException {
        deletePrefix(BlobKeys.userPrefix(userId));
    }

    @Override
    public void deleteTryOnSessionFolder(UUID userId, UUID sessionId) throws IOException {
        deletePrefix(BlobKeys.tryOnSessionPrefix(userId, sessionId));
    }

    private Path resolvePhysicalPath(String ref) {
        if (ref == null || ref.isBlank()) {
            throw new IllegalArgumentException("STORAGE_KEY_REQUIRED");
        }
        String normalized = normalizeKey(ref);
        Path asPath = Path.of(normalized);
        if (asPath.isAbsolute()) {
            if (normalized.startsWith(rootPath.toString())) {
                return asPath.normalize();
            }
            return asPath.normalize();
        }
        return rootPath.resolve(normalized).normalize();
    }

    static String normalizeKey(String ref) {
        return ref.replace('\\', '/');
    }

    private void deleteDirectoryTree(Path root) throws IOException {
        try (var paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ex) {
                    throw new IllegalStateException("STORAGE_DELETE_FAILED", ex);
                }
            });
        }
    }
}
