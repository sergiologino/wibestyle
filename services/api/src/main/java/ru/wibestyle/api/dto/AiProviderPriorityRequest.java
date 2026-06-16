package ru.wibestyle.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AiProviderPriorityRequest(
        @NotEmpty List<@Valid AiProviderPriorityItemRequest> items
) {
    public record AiProviderPriorityItemRequest(
            @NotBlank String networkName,
            @NotBlank String displayName,
            @NotNull Integer priorityOrder,
            @NotNull Boolean enabled
    ) {
    }
}
