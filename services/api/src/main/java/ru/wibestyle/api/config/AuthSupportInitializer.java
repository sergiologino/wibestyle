package ru.wibestyle.api.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.support.AuthSupport;

@Component
public class AuthSupportInitializer {

    private final JwtService jwtService;
    private final AuthProperties authProperties;

    public AuthSupportInitializer(JwtService jwtService, AuthProperties authProperties) {
        this.jwtService = jwtService;
        this.authProperties = authProperties;
    }

    @PostConstruct
    void init() {
        AuthSupport.configure(jwtService, authProperties);
    }
}
