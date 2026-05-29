package ru.wibestyle.api.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.StorageProperties;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.UUID;

@Service
public class LocalStorageService {

    private final StorageProperties storageProperties;
    private Path rootPath;

    public LocalStorageService(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    void init() throws IOException {
        rootPath = resolveStorageRoot();
        Files.createDirectories(rootPath);
    }

    /**
     * Prefer explicit WIBESTYLE_STORAGE_ROOT; keep existing ./data/storage in cwd; otherwise ~/.wibestyle/storage.
     */
    static Path resolveStorageRoot(String configuredRoot) {
        String configured = configuredRoot == null ? "" : configuredRoot.trim();
        String envOverride = System.getenv("WIBESTYLE_STORAGE_ROOT");
        if (envOverride != null && !envOverride.isBlank()) {
            return Path.of(envOverride).toAbsolutePath().normalize();
        }
        if (!configured.isBlank() && !"./data/storage".equals(configured)) {
            Path path = Path.of(configured);
            return path.isAbsolute() ? path.normalize() : Path.of(System.getProperty("user.dir")).resolve(path).normalize();
        }
        Path cwdData = Path.of(System.getProperty("user.dir")).resolve("data").resolve("storage");
        if (Files.exists(cwdData)) {
            return cwdData.toAbsolutePath().normalize();
        }
        return Path.of(System.getProperty("user.home"), ".wibestyle", "storage").toAbsolutePath().normalize();
    }

    private Path resolveStorageRoot() {
        return resolveStorageRoot(storageProperties.getRoot());
    }

    public String storeOriginal(UUID userId, UUID avatarId, String extension, InputStream inputStream) throws IOException {
        Path target = resolvePath(userId, avatarId, "original" + extension);
        Files.createDirectories(target.getParent());
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public String storeProcessed(UUID userId, UUID avatarId, Path source) throws IOException {
        Path target = resolvePath(userId, avatarId, "processed.jpg");
        Files.createDirectories(target.getParent());
        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public String storeGarmentPhoto(UUID userId, UUID sessionId, String extension, InputStream inputStream) throws IOException {
        Path target = rootPath.resolve(userId.toString()).resolve("try-on").resolve(sessionId.toString()).resolve("garment" + extension);
        Files.createDirectories(target.getParent());
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public String storeTryOnResult(UUID userId, UUID sessionId, String variant, InputStream inputStream) throws IOException {
        Path target = rootPath.resolve(userId.toString()).resolve("try-on").resolve(sessionId.toString()).resolve(variant + ".jpg");
        Files.createDirectories(target.getParent());
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public String storeTryOnVideo(UUID userId, UUID sessionId, InputStream inputStream) throws IOException {
        Path target = rootPath.resolve(userId.toString()).resolve("try-on").resolve(sessionId.toString()).resolve("season-hit.mp4");
        Files.createDirectories(target.getParent());
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public byte[] readBytes(String storedPath) throws IOException {
        return Files.readAllBytes(resolve(storedPath));
    }

    public String resolveTryOnResultPath(UUID userId, UUID sessionId, String variant) {
        return rootPath.resolve(userId.toString()).resolve("try-on").resolve(sessionId.toString()).resolve(variant + ".jpg").toString();
    }

    public String resolveTryOnVideoPath(UUID userId, UUID sessionId) {
        return rootPath.resolve(userId.toString()).resolve("try-on").resolve(sessionId.toString()).resolve("season-hit.mp4").toString();
    }

    public Path resolve(String storedPath) {
        return Path.of(storedPath).normalize();
    }

    public boolean exists(String storedPath) {
        return storedPath != null && Files.exists(resolve(storedPath));
    }

    public String storeMediaAsset(UUID userId, UUID assetId, String extension, InputStream inputStream) throws IOException {
        Path target = rootPath.resolve(userId.toString()).resolve("media").resolve(assetId.toString() + extension);
        Files.createDirectories(target.getParent());
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        return target.toString();
    }

    public void deleteUserData(UUID userId) throws IOException {
        Path userDir = rootPath.resolve(userId.toString());
        if (!Files.exists(userDir)) {
            return;
        }
        try (var paths = Files.walk(userDir)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ex) {
                    throw new IllegalStateException("STORAGE_DELETE_FAILED", ex);
                }
            });
        }
    }

    private Path resolvePath(UUID userId, UUID avatarId, String filename) {
        return rootPath.resolve(userId.toString()).resolve(avatarId.toString()).resolve(filename);
    }
}
