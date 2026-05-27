package ru.wibestyle.api.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public class JdbcRefreshTokenStore implements RefreshTokenStore {

    private final JdbcTemplate jdbcTemplate;

    public JdbcRefreshTokenStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void save(String refreshToken, UUID userId, int ttlSeconds) {
        Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);
        jdbcTemplate.update("DELETE FROM auth_refresh_tokens WHERE token = ?", refreshToken);
        jdbcTemplate.update(
                "INSERT INTO auth_refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
                refreshToken,
                userId,
                Timestamp.from(expiresAt)
        );
    }

    @Override
    public Optional<UUID> consume(String refreshToken) {
        Optional<UUID> userId = jdbcTemplate.query(
                        """
                                SELECT user_id FROM auth_refresh_tokens
                                WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
                                """,
                        (rs, rowNum) -> UUID.fromString(rs.getString("user_id")),
                        refreshToken
                )
                .stream()
                .findFirst();
        if (userId.isPresent()) {
            jdbcTemplate.update("DELETE FROM auth_refresh_tokens WHERE token = ?", refreshToken);
        }
        return userId;
    }

    @Override
    public void revoke(String refreshToken) {
        jdbcTemplate.update("DELETE FROM auth_refresh_tokens WHERE token = ?", refreshToken);
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        jdbcTemplate.update("DELETE FROM auth_refresh_tokens WHERE user_id = ?", userId);
    }
}
