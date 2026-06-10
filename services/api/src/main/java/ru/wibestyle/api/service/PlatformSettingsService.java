package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.PlatformSettingEntity;
import ru.wibestyle.api.repository.PlatformSettingRepository;

import java.time.Instant;
import java.util.Map;

@Service
public class PlatformSettingsService {

    public static final String BLOCK_GOOGLE_OAUTH_KEY = "block_google_oauth";

    private final PlatformSettingRepository platformSettingRepository;

    public PlatformSettingsService(PlatformSettingRepository platformSettingRepository) {
        this.platformSettingRepository = platformSettingRepository;
    }

    public boolean isBlockGoogleOAuth() {
        return platformSettingRepository.findById(BLOCK_GOOGLE_OAUTH_KEY)
                .map(setting -> Boolean.parseBoolean(setting.getValue()))
                .orElse(false);
    }

    @Transactional
    public void setBlockGoogleOAuth(boolean block) {
        PlatformSettingEntity setting = platformSettingRepository.findById(BLOCK_GOOGLE_OAUTH_KEY)
                .orElseGet(() -> new PlatformSettingEntity(BLOCK_GOOGLE_OAUTH_KEY, "false", Instant.now()));
        setting.setValue(Boolean.toString(block));
        setting.setUpdatedAt(Instant.now());
        platformSettingRepository.save(setting);
    }

    public Map<String, Object> snapshot() {
        return Map.of("blockGoogleOAuth", isBlockGoogleOAuth());
    }
}
