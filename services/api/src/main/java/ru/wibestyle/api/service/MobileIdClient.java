package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.MobileIdProperties;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;

@Service
public class MobileIdClient {
    private final MobileIdProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Autowired
    public MobileIdClient(MobileIdProperties properties, ObjectMapper objectMapper) {
        this(properties, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                .build(), objectMapper, Clock.systemUTC());
    }

    MobileIdClient(MobileIdProperties properties, HttpClient httpClient, ObjectMapper objectMapper, Clock clock) {
        this.properties = properties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    public String createInitToken(String fingerprintHash) {
        requireConfigured();
        String timestamp = String.valueOf(clock.instant().getEpochSecond());
        JsonNode response = post("/api/token", Map.of(
                "client_id", properties.getClientId(),
                "fingerprint_hash", fingerprintHash,
                "timestamp", timestamp,
                "signature", sign(properties.getClientId() + fingerprintHash + timestamp)
        ));
        String token = response.path("token").asText("");
        if (token.isBlank()) throw new MobileIdException("MOBILE_ID_INVALID_RESPONSE");
        return token;
    }

    public VerifiedPhone verify(String sessionId, String verifyToken) {
        requireConfigured();
        String timestamp = String.valueOf(clock.instant().getEpochSecond());
        JsonNode response = post("/api/siteverify", Map.of(
                "client_id", properties.getClientId(),
                "session_id", sessionId,
                "verify_token", verifyToken,
                "timestamp", timestamp,
                "signature", sign(properties.getClientId() + sessionId + timestamp)
        ));
        String phone = response.path("phone").asText("").replaceAll("\\D", "");
        if (!response.path("success").asBoolean(false)
                || !"verified".equals(response.path("status").asText())
                || phone.length() < 10
                || phone.length() > 15) {
            throw new IllegalArgumentException("MOBILE_ID_VERIFICATION_FAILED");
        }
        return new VerifiedPhone(phone);
    }

    private JsonNode post(String path, Map<String, String> payload) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(properties.getBaseUrl() + path))
                    .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new MobileIdException("MOBILE_ID_UNAVAILABLE");
            }
            return objectMapper.readTree(response.body());
        } catch (MobileIdException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new MobileIdException("MOBILE_ID_UNAVAILABLE", ex);
        }
    }

    private String sign(String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getApiSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new MobileIdException("MOBILE_ID_SIGNATURE_FAILED", ex);
        }
    }

    private void requireConfigured() {
        if (!properties.isConfigured()) throw new MobileIdException("MOBILE_ID_NOT_CONFIGURED");
    }

    public record VerifiedPhone(String phone) {}
}
