package ru.wibestyle.api.auth;



import io.jsonwebtoken.Claims;

import io.jsonwebtoken.Jwts;

import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Service;

import ru.wibestyle.api.config.AuthProperties;



import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;

import java.time.Instant;

import java.util.Date;

import java.util.UUID;



@Service

public class JwtService {



    private static final String CLAIM_TYPE = "typ";

    private static final String CLAIM_ROLE = "role";

    private static final String TYPE_ADMIN = "admin";



    private final SecretKey secretKey;

    private final int accessTokenTtlSeconds;



    public JwtService(AuthProperties authProperties) {

        String jwtSecret = authProperties.getJwtSecret();
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT secret must be at least 32 bytes (env WIBESTYLE_JWT_SECRET), got "
                            + keyBytes.length
                            + " bytes for value length "
                            + jwtSecret.length()
                            + ". Do not use WIBESTYLE_ADMIN_API_KEY here. "
                            + "Example: dev-jwt-secret-change-me-in-production-min-32-chars"
            );
        }

        this.secretKey = Keys.hmacShaKeyFor(keyBytes);

        this.accessTokenTtlSeconds = authProperties.getAccessTokenTtlSeconds();

    }



    public String createAccessToken(UUID userId) {

        return createAccessToken(userId, accessTokenTtlSeconds);

    }



    public String createAccessToken(UUID userId, int ttlSeconds) {

        Instant now = Instant.now();

        return Jwts.builder()

                .subject(userId.toString())

                .claim(CLAIM_TYPE, "user")

                .issuedAt(Date.from(now))

                .expiration(Date.from(now.plusSeconds(ttlSeconds)))

                .signWith(secretKey)

                .compact();

    }



    public String createAdminAccessToken(UUID adminUserId, String role, int ttlSeconds) {

        Instant now = Instant.now();

        return Jwts.builder()

                .subject(adminUserId.toString())

                .claim(CLAIM_TYPE, TYPE_ADMIN)

                .claim(CLAIM_ROLE, role)

                .issuedAt(Date.from(now))

                .expiration(Date.from(now.plusSeconds(ttlSeconds)))

                .signWith(secretKey)

                .compact();

    }



    public UUID parseUserId(String token) {

        Claims claims = parseClaims(token);

        if (TYPE_ADMIN.equals(claims.get(CLAIM_TYPE))) {

            throw new IllegalArgumentException("UNAUTHORIZED");

        }

        return UUID.fromString(claims.getSubject());

    }



    public UUID parseAdminUserId(String token) {

        Claims claims = parseClaims(token);

        if (!TYPE_ADMIN.equals(claims.get(CLAIM_TYPE))) {

            throw new IllegalArgumentException("ADMIN_UNAUTHORIZED");

        }

        return UUID.fromString(claims.getSubject());

    }



    public String parseAdminRole(String token) {

        Claims claims = parseClaims(token);

        Object role = claims.get(CLAIM_ROLE);

        return role == null ? null : role.toString();

    }



    public boolean isAdminToken(String token) {

        try {

            return TYPE_ADMIN.equals(parseClaims(token).get(CLAIM_TYPE));

        } catch (RuntimeException ex) {

            return false;

        }

    }



    private Claims parseClaims(String token) {

        return Jwts.parser()

                .verifyWith(secretKey)

                .build()

                .parseSignedClaims(token)

                .getPayload();

    }



    public int accessTokenTtlSeconds() {

        return accessTokenTtlSeconds;

    }

}

