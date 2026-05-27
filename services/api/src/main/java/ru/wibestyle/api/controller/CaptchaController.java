package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.service.CaptchaService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/captcha")
public class CaptchaController {

    private final CaptchaService captchaService;

    public CaptchaController(CaptchaService captchaService) {
        this.captchaService = captchaService;
    }

    @GetMapping
    public Map<String, Object> create() {
        return captchaService.createChallenge();
    }
}
