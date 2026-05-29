package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.config.SecurityProperties;
import ru.wibestyle.api.domain.MediaAssetEntity;
import ru.wibestyle.api.dto.CompleteUploadRequest;
import ru.wibestyle.api.dto.UploadUrlRequest;
import ru.wibestyle.api.repository.MediaAssetRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaService {

    private static final int UPLOAD_TTL_SECONDS = 900;

    private final MediaAssetRepository mediaAssetRepository;
    private final BlobStorage blobStorage;
    private final ImageSanitizerService imageSanitizerService;
    private final MediaAccessTokenService mediaAccessTokenService;
    private final SecurityProperties securityProperties;

    public MediaService(
            MediaAssetRepository mediaAssetRepository,
            BlobStorage blobStorage,
            ImageSanitizerService imageSanitizerService,
            MediaAccessTokenService mediaAccessTokenService,
            SecurityProperties securityProperties
    ) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.blobStorage = blobStorage;
        this.imageSanitizerService = imageSanitizerService;
        this.mediaAccessTokenService = mediaAccessTokenService;
        this.securityProperties = securityProperties;
    }

    @Transactional
    public Map<String, Object> createUploadUrl(UUID userId, UploadUrlRequest request) {
        Instant now = Instant.now();
        UUID assetId = UUID.randomUUID();
        String uploadToken = UUID.randomUUID().toString().replace("-", "");

        MediaAssetEntity asset = new MediaAssetEntity(
                assetId,
                userId,
                request.purpose(),
                request.contentType(),
                uploadToken,
                now.plusSeconds(UPLOAD_TTL_SECONDS),
                now
        );
        mediaAssetRepository.save(asset);

        Map<String, Object> response = new HashMap<>();
        response.put("assetId", assetId.toString());
        response.put("uploadToken", uploadToken);
        response.put("uploadUrl", "/api/v1/media/assets/" + assetId + "/upload");
        response.put("expiresAt", asset.getExpiresAt().toString());
        response.put("status", asset.getStatus());
        return response;
    }

    @Transactional
    public Map<String, Object> upload(UUID userId, UUID assetId, String uploadToken, MultipartFile file) throws IOException {
        MediaAssetEntity asset = requirePendingAsset(userId, assetId, uploadToken);
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("FILE_REQUIRED");
        }
        if (file.getSize() > securityProperties.getMaxUploadBytes()) {
            throw new IllegalArgumentException("FILE_TOO_LARGE");
        }

        String extension = extensionFromContentType(file.getContentType());
        String storedPath = blobStorage.storeMediaAsset(userId, assetId, extension, file.getInputStream());
        if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
            imageSanitizerService.stripExifInPlace(blobStorage.resolveLocalFile(storedPath), file.getContentType());
        }
        asset.setStoredPath(storedPath);
        asset.setContentType(file.getContentType());
        asset.setStatus("uploaded");
        mediaAssetRepository.save(asset);

        return Map.of("asset", toAssetMap(asset));
    }

    @Transactional
    public Map<String, Object> completeUpload(UUID userId, CompleteUploadRequest request) {
        MediaAssetEntity asset = requirePendingOrUploadedAsset(userId, request.assetId(), request.uploadToken());
        if (asset.getStoredPath() == null || !blobStorage.exists(asset.getStoredPath())) {
            throw new IllegalArgumentException("UPLOAD_INCOMPLETE");
        }

        asset.setStatus("ready");
        asset.setCompletedAt(Instant.now());
        mediaAssetRepository.save(asset);

        Map<String, Object> assetMap = toAssetMap(asset);
        assetMap.put("exifRemoved", asset.getContentType() != null && asset.getContentType().startsWith("image/"));
        assetMap.put("accessToken", mediaAccessTokenService.createToken(asset.getId(), userId));
        assetMap.put("accessTokenTtlSeconds", securityProperties.getMediaAccessTtlSeconds());
        return Map.of("asset", assetMap);
    }

    public MediaAssetEntity requireReadableAssetByToken(UUID assetId, String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalArgumentException("MEDIA_ACCESS_DENIED");
        }
        try {
            String decoded = new String(java.util.Base64.getUrlDecoder().decode(accessToken), java.nio.charset.StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 4) {
                throw new IllegalArgumentException("MEDIA_ACCESS_DENIED");
            }
            UUID tokenAssetId = UUID.fromString(parts[0]);
            UUID userId = UUID.fromString(parts[1]);
            if (!assetId.equals(tokenAssetId)) {
                throw new IllegalArgumentException("MEDIA_ACCESS_DENIED");
            }
            if (!mediaAccessTokenService.validate(assetId, userId, accessToken)) {
                throw new IllegalArgumentException("MEDIA_ACCESS_DENIED");
            }
            return requireReadableAssetForOwner(userId, assetId);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("MEDIA_ACCESS_DENIED");
        }
    }

    public MediaAssetEntity requireReadableAssetForOwner(UUID userId, UUID assetId) {
        MediaAssetEntity asset = mediaAssetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("MEDIA_NOT_FOUND"));
        if (!"ready".equals(asset.getStatus()) || asset.getStoredPath() == null) {
            throw new IllegalArgumentException("MEDIA_NOT_READY");
        }
        return asset;
    }

    private MediaAssetEntity requirePendingAsset(UUID userId, UUID assetId, String uploadToken) {
        MediaAssetEntity asset = mediaAssetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("MEDIA_NOT_FOUND"));
        assertTokenValid(asset, uploadToken);
        if (!"pending".equals(asset.getStatus())) {
            throw new IllegalArgumentException("MEDIA_INVALID_STATE");
        }
        return asset;
    }

    private MediaAssetEntity requirePendingOrUploadedAsset(UUID userId, UUID assetId, String uploadToken) {
        MediaAssetEntity asset = mediaAssetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new IllegalArgumentException("MEDIA_NOT_FOUND"));
        assertTokenValid(asset, uploadToken);
        if (!"pending".equals(asset.getStatus()) && !"uploaded".equals(asset.getStatus())) {
            throw new IllegalArgumentException("MEDIA_INVALID_STATE");
        }
        return asset;
    }

    private void assertTokenValid(MediaAssetEntity asset, String uploadToken) {
        if (asset.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("UPLOAD_EXPIRED");
        }
        if (!asset.getUploadToken().equals(uploadToken)) {
            throw new IllegalArgumentException("UPLOAD_TOKEN_INVALID");
        }
    }

    private Map<String, Object> toAssetMap(MediaAssetEntity asset) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", asset.getId().toString());
        map.put("purpose", asset.getPurpose());
        map.put("status", asset.getStatus());
        map.put("contentType", asset.getContentType());
        if (asset.getStoredPath() != null) {
            map.put("url", "/api/v1/media/assets/" + asset.getId());
        }
        if (asset.getCompletedAt() != null) {
            map.put("completedAt", asset.getCompletedAt().toString());
        }
        return map;
    }

    private String extensionFromContentType(String contentType) {
        if (contentType == null) {
            return ".bin";
        }
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".bin";
        };
    }
}
