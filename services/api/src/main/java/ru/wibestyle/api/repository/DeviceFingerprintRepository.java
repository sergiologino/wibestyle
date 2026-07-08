package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.DeviceFingerprintEntity;

public interface DeviceFingerprintRepository extends JpaRepository<DeviceFingerprintEntity, String> {
}
