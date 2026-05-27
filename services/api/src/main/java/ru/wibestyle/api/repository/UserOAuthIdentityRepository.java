package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.UserOAuthIdentityEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserOAuthIdentityRepository extends JpaRepository<UserOAuthIdentityEntity, UUID> {
    Optional<UserOAuthIdentityEntity> findByProviderAndProviderUserId(String provider, String providerUserId);
}
