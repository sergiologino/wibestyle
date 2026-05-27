package ru.wibestyle.api.auth;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryRefreshTokenStore implements RefreshTokenStore {

    private final Map<String, Entry> tokens = new ConcurrentHashMap<>();

    @Override
    public void save(String refreshToken, UUID userId, int ttlSeconds) {
        tokens.put(refreshToken, new Entry(userId, Instant.now().plusSeconds(ttlSeconds)));
    }

    @Override
    public Optional<UUID> consume(String refreshToken) {
        Entry entry = tokens.get(refreshToken);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            tokens.remove(refreshToken);
            return Optional.empty();
        }
        return Optional.of(entry.userId());
    }

    @Override
    public void revoke(String refreshToken) {
        tokens.remove(refreshToken);
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        tokens.entrySet().removeIf(entry -> userId.equals(entry.getValue().userId()));
    }

    private record Entry(UUID userId, Instant expiresAt) {
    }
}
