package ru.wibestyle.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MobileIdTokenRequest(
        @JsonProperty("fingerprint_hash") @NotBlank @Size(max = 256) String fingerprintHash
) {}
