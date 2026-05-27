package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLeadStatusRequest(
        @NotBlank String status
) {
}
