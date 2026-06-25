package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotNull;

public record AutoRenewPatchRequest(@NotNull Boolean enabled) {}
