package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.AvatarEntity;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class AvatarPreprocessService {

    private final LocalStorageService localStorageService;

    public AvatarPreprocessService(LocalStorageService localStorageService) {
        this.localStorageService = localStorageService;
    }

    public String preprocess(AvatarEntity avatar) throws IOException {
        Path original = localStorageService.resolve(avatar.getPhotoOriginalPath());
        if (!Files.exists(original)) {
            throw new IllegalArgumentException("PHOTO_NOT_FOUND");
        }

        UUID userId = avatar.getUserId();
        UUID avatarId = avatar.getId();
        String processedPath = localStorageService.storeProcessed(userId, avatarId, original);
        avatar.setExifRemoved(true);
        avatar.setPhotoProcessedPath(processedPath);
        return processedPath;
    }
}
