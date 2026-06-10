package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.StartEmailOtpRequest;
import ru.wibestyle.api.dto.VerifyOtpRequest;
import ru.wibestyle.api.service.AuthService;
import ru.wibestyle.api.support.AuthResponseSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/email-otp")
public class EmailOtpController {

    private final AuthService authService;

    public EmailOtpController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/start")
    public Map<String, Object> start(@Valid @RequestBody StartEmailOtpRequest request) {
        try {
            AuthService.OtpStartResult result = authService.startEmailOtp(request.email());
            return Map.of("requestId", result.requestId(), "expiresIn", result.expiresIn());
        } catch (IllegalArgumentException ex) {
            throw mapStartError(ex);
        }
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            AuthService.AuthResult result = authService.verifyEmailOtp(
                    request.requestId(),
                    request.code(),
                    request.promoCode()
            );
            return AuthResponseSupport.fromAuthResult(result);
        } catch (IllegalArgumentException ex) {
            throw mapVerifyError(ex);
        }
    }

    private ResponseStatusException mapStartError(IllegalArgumentException ex) {
        if ("OTP_RESEND_COOLDOWN".equals(ex.getMessage())) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bad email", ex);
    }

    private ResponseStatusException mapVerifyError(IllegalArgumentException ex) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP", ex);
    }
}
