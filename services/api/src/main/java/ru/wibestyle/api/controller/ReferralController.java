package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.service.ReferralService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/referrals")
public class ReferralController {
    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping
    public Map<String, Object> overview(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return referralService.overview(AuthSupport.requireUserId(authorization));
    }
}
