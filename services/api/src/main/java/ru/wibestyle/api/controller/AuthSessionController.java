package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.LogoutRequest;
import ru.wibestyle.api.dto.RefreshTokenRequest;
import ru.wibestyle.api.service.AuthService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthSessionController {

    private final AuthService authService;

    public AuthSessionController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/refresh")
    public Map<String, Object> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            AuthService.AuthResult result = authService.refresh(request.refreshToken());
            return authResponse(result);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token", ex);
        }
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return Map.of("loggedOut", true);
    }

    private Map<String, Object> authResponse(AuthService.AuthResult result) {
        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", result.accessToken());
        response.put("refreshToken", result.refreshToken());
        response.put("expiresIn", result.expiresIn());
        response.put("tokenType", "Bearer");
        response.put("user", Map.of("id", result.user().getId(), "phone", result.user().getPhone()));
        response.put("newUser", result.newUser());
        response.put("promo", result.promo());
        return response;
    }
}
