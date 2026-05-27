package ru.wibestyle.api.auth;

import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

public class RedisRefreshTokenStore implements RefreshTokenStore {

    private static final String PREFIX = "wibestyle:refresh:";

    private final StringRedisTemplate redisTemplate;

    public RedisRefreshTokenStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void save(String refreshToken, UUID userId, int ttlSeconds) {
        redisTemplate.opsForValue().set(key(refreshToken), userId.toString(), Duration.ofSeconds(ttlSeconds));
    }

    @Override
    public Optional<UUID> consume(String refreshToken) {
        String userId = redisTemplate.opsForValue().getAndDelete(key(refreshToken));
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(userId));
    }

    @Override
    public void revoke(String refreshToken) {
        redisTemplate.delete(key(refreshToken));
    }

    private String key(String refreshToken) {
        return PREFIX + refreshToken;
    }
}
