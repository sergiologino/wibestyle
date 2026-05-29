package ru.wibestyle.api.storage;

import java.util.UUID;

/** Relative object keys — same layout for local disk and future S3/Coolify volume. */
public final class BlobKeys {

    private BlobKeys() {
    }

    public static String avatarOriginal(UUID userId, UUID avatarId, String extension) {
        return userId + "/" + avatarId + "/original" + extension;
    }

    public static String avatarProcessed(UUID userId, UUID avatarId) {
        return userId + "/" + avatarId + "/processed.jpg";
    }

    public static String tryOnGarment(UUID userId, UUID sessionId, String extension) {
        return userId + "/try-on/" + sessionId + "/garment" + extension;
    }

    public static String tryOnResult(UUID userId, UUID sessionId, String variant) {
        return userId + "/try-on/" + sessionId + "/" + variant + ".jpg";
    }

    public static String tryOnVideo(UUID userId, UUID sessionId) {
        return userId + "/try-on/" + sessionId + "/season-hit.mp4";
    }

    public static String mediaAsset(UUID userId, UUID assetId, String extension) {
        return userId + "/media/" + assetId + extension;
    }

    public static String userPrefix(UUID userId) {
        return userId + "/";
    }

    public static String tryOnSessionPrefix(UUID userId, UUID sessionId) {
        return userId + "/try-on/" + sessionId + "/";
    }
}
