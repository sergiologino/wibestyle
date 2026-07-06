package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MobileIdHandoffService {
    private static final long TTL_SECONDS = 120;
    private final Map<String, PendingAuth> pending = new ConcurrentHashMap<>();

    public String create(AuthService.AuthResult authResult) {
        removeExpired();
        String code = UUID.randomUUID().toString();
        pending.put(code, new PendingAuth(authResult, Instant.now().plusSeconds(TTL_SECONDS)));
        return code;
    }

    public AuthService.AuthResult consume(String code) {
        PendingAuth value = pending.remove(code);
        if (value == null || value.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("MOBILE_ID_HANDOFF_INVALID");
        }
        return value.authResult();
    }

    private void removeExpired() {
        Instant now = Instant.now();
        pending.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private record PendingAuth(AuthService.AuthResult authResult, Instant expiresAt) {}
}
