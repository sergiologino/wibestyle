package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.PlatformSettingEntity;

public interface PlatformSettingRepository extends JpaRepository<PlatformSettingEntity, String> {
}
