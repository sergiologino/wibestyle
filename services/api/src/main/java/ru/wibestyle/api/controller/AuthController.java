package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.StartOtpRequest;
import ru.wibestyle.api.dto.VerifyOtpRequest;
import ru.wibestyle.api.service.AuthService;
import ru.wibestyle.api.support.AuthResponseSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/otp")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/start")
    public Map<String, Object> start(@Valid @RequestBody StartOtpRequest request) {
        try {
            AuthService.OtpStartResult result = authService.startOtp(request.phone());
            return Map.of("requestId", result.requestId(), "expiresIn", result.expiresIn());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bad phone", ex);
        }
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            AuthService.AuthResult result = authService.verifyOtp(
                    request.requestId(),
                    request.code(),
                    request.promoCode(),
                    request.referralCode(),
                    request.visitorId()
            );
            return AuthResponseSupport.fromAuthResult(result);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP", ex);
        }
    }
}
