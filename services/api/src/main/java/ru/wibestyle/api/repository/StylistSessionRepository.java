package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.StylistSessionEntity;

import java.util.Optional;
import java.util.UUID;

public interface StylistSessionRepository extends JpaRepository<StylistSessionEntity, UUID> {

    Optional<StylistSessionEntity> findByIdAndUserId(UUID id, UUID userId);
}
