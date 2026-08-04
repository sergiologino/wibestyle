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
    private final AvatarQualityAnalyzer avatarQualityAnalyzer;

    public AvatarValidationService(ObjectMapper objectMapper, AvatarQualityAnalyzer avatarQualityAnalyzer) {
        this.objectMapper = objectMapper;
        this.avatarQualityAnalyzer = avatarQualityAnalyzer;
    }

    public ValidationOutcome validate(
            String externalUserId,
            String filename,
            long sizeBytes,
            String contentType,
            java.nio.file.Path photoPath
    ) {
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

        AvatarQualityAnalyzer.AvatarQualityAssessment qualityAssessment =
                avatarQualityAnalyzer.analyze(externalUserId, photoPath, contentType, warnings);
        warnings = new ArrayList<>(qualityAssessment.warnings());
        if (qualityAssessment.blocking()) {
            qualityScore = Math.min(qualityScore, 0.35);
        }

        AvatarStatus status = qualityAssessment.blocking()
                ? AvatarStatus.VALIDATION_FAILED
                : AvatarStatus.PHOTO_UPLOADED;
        return ValidationOutcome.ok(
                status,
                qualityScore,
                warnings,
                qualityAssessment.title(),
                qualityAssessment.message(),
                qualityAssessment.recommendedAction()
        );
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
            List<String> warnings,
            String guidanceTitle,
            String guidanceMessage,
            String recommendedAction
    ) {
        static ValidationOutcome rejected(String code) {
            return new ValidationOutcome(true, code, AvatarStatus.REJECTED, 0, List.of(), null, null, "replace_photo");
        }

        static ValidationOutcome ok(
                AvatarStatus status,
                double qualityScore,
                List<String> warnings,
                String guidanceTitle,
                String guidanceMessage,
                String recommendedAction
        ) {
            return new ValidationOutcome(false, null, status, qualityScore, warnings, guidanceTitle, guidanceMessage, recommendedAction);
        }
    }
}
