package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MobileIdExchangeRequest(
        @NotBlank @Size(max = 128) String handoffCode
) {}
