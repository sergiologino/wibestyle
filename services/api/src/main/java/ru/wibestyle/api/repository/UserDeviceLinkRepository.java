package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.UserDeviceLinkEntity;
import ru.wibestyle.api.domain.UserDeviceLinkId;

import java.util.List;
import java.util.UUID;

public interface UserDeviceLinkRepository extends JpaRepository<UserDeviceLinkEntity, UserDeviceLinkId> {
    List<UserDeviceLinkEntity> findByUserId(UUID userId);
}
