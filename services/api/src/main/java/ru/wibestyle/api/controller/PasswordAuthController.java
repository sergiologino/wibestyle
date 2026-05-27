package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.LoginRequest;
import ru.wibestyle.api.dto.RegisterRequest;
import ru.wibestyle.api.service.PasswordAuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class PasswordAuthController {

    private final PasswordAuthService passwordAuthService;

    public PasswordAuthController(PasswordAuthService passwordAuthService) {
        this.passwordAuthService = passwordAuthService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return passwordAuthService.register(
                    request.login(),
                    request.email(),
                    request.password(),
                    request.captchaId(),
                    request.captchaAnswer(),
                    request.displayName()
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        try {
            return passwordAuthService.login(
                    request.identifier(),
                    request.password(),
                    request.captchaId(),
                    request.captchaAnswer()
            );
        } catch (IllegalArgumentException ex) {
            HttpStatus status = "LOGIN_FAILED".equals(ex.getMessage()) ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }
    }
}
