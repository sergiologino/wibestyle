package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class AvatarPreprocessService {

    private final BlobStorage blobStorage;

    public AvatarPreprocessService(BlobStorage blobStorage) {
        this.blobStorage = blobStorage;
    }

    public void preprocess(AvatarEntity avatar) throws IOException {
        Path original = blobStorage.resolveLocalFile(avatar.getPhotoOriginalPath());
        UUID userId = avatar.getUserId();
        UUID avatarId = avatar.getId();
        String processedPath = blobStorage.storeAvatarProcessed(userId, avatarId, original);
        avatar.setPhotoProcessedPath(processedPath);
        avatar.setExifRemoved(true);
    }
}
