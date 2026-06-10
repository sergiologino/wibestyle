package ru.wibestyle.api.support;

import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.service.AuthService;

import java.util.HashMap;
import java.util.Map;

public final class AuthResponseSupport {

    private AuthResponseSupport() {
    }

    public static Map<String, Object> fromAuthResult(AuthService.AuthResult result) {
        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", result.accessToken());
        response.put("refreshToken", result.refreshToken());
        response.put("expiresIn", result.expiresIn());
        response.put("tokenType", "Bearer");
        response.put("user", userMap(result.user()));
        response.put("newUser", result.newUser());
        response.put("promo", result.promo());
        return response;
    }

    public static Map<String, Object> userMap(UserEntity user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        if (user.getPhone() != null) {
            userMap.put("phone", user.getPhone());
        }
        if (user.getEmail() != null) {
            userMap.put("email", user.getEmail());
        }
        if (user.getLogin() != null) {
            userMap.put("login", user.getLogin());
        }
        return userMap;
    }
}
