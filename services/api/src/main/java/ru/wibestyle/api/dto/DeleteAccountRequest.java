package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank String confirm
) {
}
