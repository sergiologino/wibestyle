package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.MobileIdTokenRequest;
import ru.wibestyle.api.dto.MobileIdVerifyRequest;
import ru.wibestyle.api.dto.MobileIdExchangeRequest;
import ru.wibestyle.api.service.AuthService;
import ru.wibestyle.api.service.MobileIdClient;
import ru.wibestyle.api.service.MobileIdHandoffService;
import ru.wibestyle.api.support.AuthResponseSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/mobile-id")
public class MobileIdController {
    private final MobileIdClient mobileIdClient;
    private final AuthService authService;
    private final MobileIdHandoffService handoffService;

    public MobileIdController(
            MobileIdClient mobileIdClient,
            AuthService authService,
            MobileIdHandoffService handoffService
    ) {
        this.mobileIdClient = mobileIdClient;
        this.authService = authService;
        this.handoffService = handoffService;
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("enabled", mobileIdClient.isConfigured());
    }

    @PostMapping("/token")
    public Map<String, String> token(@Valid @RequestBody MobileIdTokenRequest request) {
        return Map.of("token", mobileIdClient.createInitToken(request.fingerprintHash()));
    }

    @PostMapping("/siteverify")
    public Map<String, Object> siteVerify(@Valid @RequestBody MobileIdVerifyRequest request) {
        return AuthResponseSupport.fromAuthResult(verifyAndAuthenticate(request));
    }

    @PostMapping("/siteverify/mobile")
    public Map<String, String> siteVerifyForMobile(@Valid @RequestBody MobileIdVerifyRequest request) {
        return Map.of("handoffCode", handoffService.create(verifyAndAuthenticate(request)));
    }

    @PostMapping("/exchange")
    public Map<String, Object> exchange(@Valid @RequestBody MobileIdExchangeRequest request) {
        return AuthResponseSupport.fromAuthResult(handoffService.consume(request.handoffCode()));
    }

    private AuthService.AuthResult verifyAndAuthenticate(MobileIdVerifyRequest request) {
        MobileIdClient.VerifiedPhone verified = mobileIdClient.verify(request.sessionId(), request.verifyToken());
        return authService.authenticateVerifiedPhone(
                verified.phone(), request.promoCode(), request.referralCode(), request.visitorId(), request.deviceId()
        );
    }
}
