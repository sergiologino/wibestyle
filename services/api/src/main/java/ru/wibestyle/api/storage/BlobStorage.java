package ru.wibestyle.api.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.UUID;

/**
 * Object storage abstraction. DB holds {@linkplain BlobKeys relative keys}; backend may be local disk or S3.
 */
public interface BlobStorage {

    /** Store bytes at key; returns the same key. */
    String put(String key, InputStream input) throws IOException;

    /** Copy local file to key; returns the key. */
    String putFile(String key, Path source) throws IOException;

    byte[] readBytes(String keyOrLegacyRef) throws IOException;

    boolean exists(String keyOrLegacyRef);

    /** Local filesystem path for streaming / EXIF tools (local backend only for now). */
    Path resolveLocalFile(String keyOrLegacyRef);

    void deletePrefix(String prefix) throws IOException;

    String storeAvatarOriginal(UUID userId, UUID avatarId, String extension, InputStream input) throws IOException;

    String storeAvatarProcessed(UUID userId, UUID avatarId, Path source) throws IOException;

    String storeGarmentPhoto(UUID userId, UUID sessionId, String extension, InputStream input) throws IOException;

    String storeTryOnResult(UUID userId, UUID sessionId, String variant, InputStream input) throws IOException;

    String storeTryOnVideo(UUID userId, UUID sessionId, InputStream input) throws IOException;

    String storeMediaAsset(UUID userId, UUID assetId, String extension, InputStream input) throws IOException;

    String keyTryOnResult(UUID userId, UUID sessionId, String variant);

    String keyTryOnVideo(UUID userId, UUID sessionId);

    void deleteUserData(UUID userId) throws IOException;

    void deleteTryOnSessionFolder(UUID userId, UUID sessionId) throws IOException;
}
