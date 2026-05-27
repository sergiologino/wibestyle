package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AdminUserEntity;

import java.util.Optional;
import java.util.UUID;

public interface AdminUserRepository extends JpaRepository<AdminUserEntity, UUID> {
    Optional<AdminUserEntity> findByEmailIgnoreCase(String email);

    long count();
}
