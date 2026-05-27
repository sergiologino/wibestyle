package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ParseLinkRequest(@NotBlank String url) {
}
