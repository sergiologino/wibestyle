package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.domain.AvatarStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AvatarValidationService {

    private static final Set<String> REJECTED_KEYWORDS = Set.of("nude", "naked", "nsfw", "xxx");

    private final ObjectMapper objectMapper;

    public AvatarValidationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ValidationOutcome validate(String filename, long sizeBytes, String contentType) {
        List<String> warnings = new ArrayList<>();
        filename = filename == null ? "" : filename.toLowerCase(Locale.ROOT);

        String rejectCode = rejectCodeForFilename(filename);
        if (rejectCode != null) {
            return ValidationOutcome.rejected(rejectCode);
        }

        rejectCode = rejectCodeForContentType(contentType);
        if (rejectCode != null) {
            return ValidationOutcome.rejected(rejectCode);
        }

        if (sizeBytes < 20_000) {
            warnings.add("LOW_RESOLUTION");
        }
        if (sizeBytes > 15_000_000) {
            warnings.add("FILE_TOO_LARGE");
        }

        double qualityScore = Math.min(1.0, sizeBytes / 2_000_000.0);
        if (warnings.contains("LOW_RESOLUTION")) {
            qualityScore = Math.min(qualityScore, 0.35);
        }

        AvatarStatus status = warnings.isEmpty() ? AvatarStatus.PHOTO_UPLOADED : AvatarStatus.VALIDATION_FAILED;
        return ValidationOutcome.ok(status, qualityScore, warnings);
    }

    public String rejectCodeForFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        for (String keyword : REJECTED_KEYWORDS) {
            if (lower.contains(keyword)) {
                return "INAPPROPRIATE_PHOTO";
            }
        }
        return null;
    }

    public String rejectCodeForContentType(String contentType) {
        if (contentType == null || !contentType.startsWith("image/")) {
            return "INVALID_IMAGE_TYPE";
        }
        return null;
    }

    public String serializeWarnings(List<String> warnings) {
        try {
            return objectMapper.writeValueAsString(warnings);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }

    public List<String> deserializeWarnings(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(raw, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    public record ValidationOutcome(
            boolean rejected,
            String rejectCode,
            AvatarStatus status,
            double qualityScore,
            List<String> warnings
    ) {
        static ValidationOutcome rejected(String code) {
            return new ValidationOutcome(true, code, AvatarStatus.REJECTED, 0, List.of());
        }

        static ValidationOutcome ok(AvatarStatus status, double qualityScore, List<String> warnings) {
            return new ValidationOutcome(false, null, status, qualityScore, warnings);
        }
    }
}
