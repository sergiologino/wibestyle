package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.SecurityProperties;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TTL_SECONDS = 300;

    private final SecurityProperties securityProperties;
    private final Map<String, CaptchaChallenge> challenges = new ConcurrentHashMap<>();

    public CaptchaService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public Map<String, Object> createChallenge() {
        cleanupExpired();
        int left = 2 + RANDOM.nextInt(8);
        int right = 1 + RANDOM.nextInt(9);
        String question = "Сколько будет " + left + " + " + right + "?";
        String challengeId = UUID.randomUUID().toString();
        int answer = left + right;
        challenges.put(challengeId, new CaptchaChallenge(hashAnswer(answer), Instant.now().plusSeconds(TTL_SECONDS)));
        return Map.of(
                "challengeId", challengeId,
                "question", question,
                "expiresIn", TTL_SECONDS
        );
    }

    public void verify(String challengeId, String answerRaw) {
        if (!securityProperties.isRateLimitEnabled()) {
            return;
        }
        if (challengeId == null || challengeId.isBlank() || answerRaw == null || answerRaw.isBlank()) {
            throw new IllegalArgumentException("CAPTCHA_REQUIRED");
        }
        CaptchaChallenge challenge = challenges.remove(challengeId.trim());
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("CAPTCHA_EXPIRED");
        }
        int answer;
        try {
            answer = Integer.parseInt(answerRaw.trim());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("CAPTCHA_INVALID");
        }
        if (!challenge.answerHash().equals(hashAnswer(answer))) {
            throw new IllegalArgumentException("CAPTCHA_INVALID");
        }
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        challenges.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private static String hashAnswer(int answer) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(Integer.toString(answer).getBytes()));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }

    private record CaptchaChallenge(String answerHash, Instant expiresAt) {
    }
}
