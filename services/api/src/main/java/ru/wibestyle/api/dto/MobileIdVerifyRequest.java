package ru.wibestyle.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MobileIdVerifyRequest(
        @JsonProperty("session_id") @NotBlank @Size(max = 256) String sessionId,
        @JsonProperty("verify_token") @NotBlank @Size(max = 2048) String verifyToken,
        @Size(max = 32) String promoCode,
        @Size(max = 128) String referralCode,
        @Size(max = 128) String visitorId
) {}
