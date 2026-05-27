package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.UserEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByPhone(String phone);

    Optional<UserEntity> findByLoginIgnoreCase(String login);

    Optional<UserEntity> findByEmailIgnoreCase(String email);
}
