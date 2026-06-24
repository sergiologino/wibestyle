package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PushDeviceRequest(
        @NotBlank String token,
        @NotBlank @Pattern(regexp = "android|ios") String platform
) {}
