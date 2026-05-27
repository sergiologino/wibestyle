package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.config.SecurityProperties;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class MediaAccessTokenService {

    private final SecurityProperties securityProperties;
    private final AuthProperties authProperties;

    public MediaAccessTokenService(SecurityProperties securityProperties, AuthProperties authProperties) {
        this.securityProperties = securityProperties;
        this.authProperties = authProperties;
    }

    public String createToken(UUID assetId, UUID userId) {
        long expiresAt = Instant.now().getEpochSecond() + securityProperties.getMediaAccessTtlSeconds();
        String payload = assetId + ":" + userId + ":" + expiresAt;
        String signature = sign(payload);
        return Base64.getUrlEncoder().withoutPadding().encodeToString((payload + ":" + signature).getBytes(StandardCharsets.UTF_8));
    }

    public boolean validate(UUID assetId, UUID userId, String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 4) {
                return false;
            }
            if (!assetId.toString().equals(parts[0]) || !userId.toString().equals(parts[1])) {
                return false;
            }
            long expiresAt = Long.parseLong(parts[2]);
            if (Instant.now().getEpochSecond() > expiresAt) {
                return false;
            }
            String payload = parts[0] + ":" + parts[1] + ":" + parts[2];
            return sign(payload).equals(parts[3]);
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("MEDIA_TOKEN_SIGN_FAILED", ex);
        }
    }
}
