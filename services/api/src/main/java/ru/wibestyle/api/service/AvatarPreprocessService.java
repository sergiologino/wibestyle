package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.UUID;

@Service
public class AvatarPreprocessService {

    private final BlobStorage blobStorage;
    private final AvatarPrivacyImageProcessor privacyImageProcessor;

    public AvatarPreprocessService(BlobStorage blobStorage, AvatarPrivacyImageProcessor privacyImageProcessor) {
        this.blobStorage = blobStorage;
        this.privacyImageProcessor = privacyImageProcessor;
    }

    public void preprocess(AvatarEntity avatar) throws IOException {
        Path original = blobStorage.resolveLocalFile(avatar.getPhotoOriginalPath());
        UUID userId = avatar.getUserId();
        UUID avatarId = avatar.getId();
        Path processed = Files.createTempFile("wibestyle-avatar-", ".jpg");
        String processedPath;
        try {
            privacyImageProcessor.writeJpeg(
                    privacyImageProcessor.process(original, avatar.isPrivacyFaceHidden(), avatar.isPrivacyBackgroundHidden()),
                    processed
            );
            processedPath = blobStorage.storeAvatarProcessed(userId, avatarId, processed);
        } catch (IOException ex) {
            if (!"AVATAR_IMAGE_READ_FAILED".equals(ex.getMessage())) {
                throw ex;
            }
            processedPath = blobStorage.storeAvatarProcessed(userId, avatarId, original);
        } finally {
            Files.deleteIfExists(processed);
        }
        avatar.setPhotoProcessedPath(processedPath);
        avatar.setExifRemoved(true);
    }
}
