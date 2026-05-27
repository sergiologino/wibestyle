package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.TryOnJobEntity;

import java.util.Optional;
import java.util.UUID;

public interface TryOnJobRepository extends JpaRepository<TryOnJobEntity, UUID> {

    Optional<TryOnJobEntity> findByIdempotencyKey(String idempotencyKey);
}
