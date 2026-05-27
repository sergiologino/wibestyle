package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ValidatePromoRequest(@NotBlank String code) {
}
