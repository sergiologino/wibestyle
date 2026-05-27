package ru.wibestyle.api.auth;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenStore {

    void save(String refreshToken, UUID userId, int ttlSeconds);

    Optional<UUID> consume(String refreshToken);

    void revoke(String refreshToken);

    default void revokeAllForUser(UUID userId) {
    }
}
