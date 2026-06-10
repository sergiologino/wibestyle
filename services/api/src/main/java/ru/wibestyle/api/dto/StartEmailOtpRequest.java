package ru.wibestyle.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StartEmailOtpRequest(@NotBlank @Email String email) {
}
