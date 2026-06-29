package ru.wibestyle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MarketingChannelRequest(
        @NotBlank @Size(max = 64) @Pattern(regexp = "^[a-z0-9_]+$") String code,
        @NotBlank @Size(max = 160) String displayName,
        @Size(max = 100) @Pattern(regexp = "^[a-z0-9_]*$") String utmSource,
        @Size(max = 100) @Pattern(regexp = "^[a-z0-9_]*$") String utmMedium,
        @Size(max = 500) String description,
        boolean enabled
) {
}
