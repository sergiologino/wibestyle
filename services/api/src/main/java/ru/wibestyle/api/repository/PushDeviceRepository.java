package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.PushDeviceEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PushDeviceRepository extends JpaRepository<PushDeviceEntity, UUID> {
    Optional<PushDeviceEntity> findByExpoPushToken(String expoPushToken);
    List<PushDeviceEntity> findByUserIdAndEnabledTrue(UUID userId);
}
