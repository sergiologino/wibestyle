package ru.wibestyle.api.support;

import io.jsonwebtoken.JwtException;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AuthProperties;

import java.util.UUID;

public final class AuthSupport {

    private static JwtService jwtService;
    private static AuthProperties authProperties;

    private AuthSupport() {
    }

    public static void configure(JwtService jwt, AuthProperties properties) {
        jwtService = jwt;
        authProperties = properties;
    }

    public static UUID requireUserId(String authorization) {
        UUID userId = optionalUserId(authorization);
        if (userId == null) {
            throw new IllegalArgumentException("UNAUTHORIZED");
        }
        return userId;
    }

    public static UUID optionalUserId(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return null;
        }
        if (token.startsWith("access-") && authProperties != null && authProperties.isLegacyAccessTokenEnabled()) {
            try {
                return UUID.fromString(token.substring("access-".length()));
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
        if (jwtService == null) {
            return null;
        }
        try {
            return jwtService.parseUserId(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }
}
