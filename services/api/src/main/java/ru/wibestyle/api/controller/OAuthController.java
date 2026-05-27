package ru.wibestyle.api.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.service.OAuthService;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/oauth")
public class OAuthController {

    private final OAuthService oAuthService;

    public OAuthController(OAuthService oAuthService) {
        this.oAuthService = oAuthService;
    }

    @GetMapping("/providers")
    public Map<String, Object> providers() {
        return oAuthService.providerStatus();
    }

    @GetMapping("/{provider}/start")
    public Map<String, Object> start(@PathVariable String provider) {
        try {
            return oAuthService.start(provider);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<Void> callback(
            @PathVariable String provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state
    ) {
        try {
            URI redirect = oAuthService.completeCallback(provider, code, state);
            return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, redirect.toString()).build();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
