package ru.wibestyle.api.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class TokenIssuanceService {

    private final JwtService jwtService;
    private final RefreshTokenStore refreshTokenStore;
    private final AuthProperties authProperties;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public TokenIssuanceService(
            JwtService jwtService,
            RefreshTokenStore refreshTokenStore,
            AuthProperties authProperties,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.authProperties = authProperties;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> issueUserTokens(UserEntity user, boolean newUser, Map<String, Object> promoResult) {
        entityManager.flush();
        String accessToken = jwtService.createAccessToken(user.getId());
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.save(refreshToken, user.getId(), authProperties.getRefreshTokenTtlSeconds());

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);
        response.put("expiresIn", jwtService.accessTokenTtlSeconds());
        response.put("tokenType", "Bearer");
        response.put("newUser", newUser);
        response.put("promo", promoResult == null ? Map.of("redeemed", false) : promoResult);
        response.put("user", userToMap(user));
        return response;
    }

    @Transactional
    public Map<String, Object> issueImpersonationTokens(UserEntity user) {
        entityManager.flush();
        String accessToken = jwtService.createAccessToken(user.getId(), authProperties.getAccessTokenTtlSeconds() / 2);
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.save(refreshToken, user.getId(), Math.min(authProperties.getRefreshTokenTtlSeconds(), 86400));

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);
        response.put("expiresIn", authProperties.getAccessTokenTtlSeconds() / 2);
        response.put("tokenType", "Bearer");
        response.put("impersonated", true);
        response.put("user", userToMap(user));
        return response;
    }

    private Map<String, Object> userToMap(UserEntity user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId().toString());
        if (user.getPhone() != null) {
            map.put("phone", user.getPhone());
        }
        if (user.getEmail() != null) {
            map.put("email", user.getEmail());
        }
        if (user.getLogin() != null) {
            map.put("login", user.getLogin());
        }
        return map;
    }
}
