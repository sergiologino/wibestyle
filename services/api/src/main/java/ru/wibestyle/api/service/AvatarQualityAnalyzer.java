package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AvatarQualityAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(AvatarQualityAnalyzer.class);

    private static final Set<String> BLOCKING_CODES = Set.of(
            "NO_PERSON",
            "MULTIPLE_PEOPLE",
            "HEAD_ONLY",
            "BODY_TOO_SMALL",
            "SIDEWAYS_OR_UPSIDE_DOWN",
            "LOW_DETAIL"
    );

    private final ObjectMapper objectMapper;
    private final AiIntegrationProperties aiProperties;
    private final NoteappAiClient noteappAiClient;

    public AvatarQualityAnalyzer(
            ObjectMapper objectMapper,
            AiIntegrationProperties aiProperties,
            NoteappAiClient noteappAiClient
    ) {
        this.objectMapper = objectMapper;
        this.aiProperties = aiProperties;
        this.noteappAiClient = noteappAiClient;
    }

    public AvatarQualityAssessment analyze(
            String externalUserId,
            Path photo,
            String contentType,
            List<String> initialWarnings
    ) {
        LinkedHashSet<String> warnings = new LinkedHashSet<>(initialWarnings);
        ImageStats stats = inspectImage(photo);
        if (stats.readable()) {
            if (stats.width() < 600 || stats.height() < 800) {
                warnings.add("LOW_DETAIL");
            }
            double ratio = stats.width() / (double) stats.height();
            if (ratio > 1.05) {
                warnings.add("LANDSCAPE_FRAME");
            }
            if (ratio < 0.35 || ratio > 1.35) {
                warnings.add("UNUSUAL_CROP");
            }
        } else {
            warnings.add("LOW_DETAIL");
        }

        AvatarQualityAssessment aiAssessment = analyzeWithVision(externalUserId, photo, contentType);
        if (aiAssessment != null) {
            warnings.addAll(aiAssessment.warnings());
        }

        List<String> warningList = List.copyOf(warnings);
        boolean blocking = warningList.stream().anyMatch(BLOCKING_CODES::contains);
        String title = blocking ? "Давайте выберем кадр, на котором образ получится точнее" : "Фото подойдёт для примерки";
        String message = buildUserMessage(warningList, blocking);
        String recommendedAction = blocking ? "replace_photo" : warningList.isEmpty() ? "continue" : "continue_with_warning";
        return new AvatarQualityAssessment(warningList, blocking, title, message, recommendedAction);
    }

    private ImageStats inspectImage(Path photo) {
        try {
            BufferedImage image = ImageIO.read(photo.toFile());
            if (image == null) {
                return new ImageStats(0, 0, false);
            }
            return new ImageStats(image.getWidth(), image.getHeight(), true);
        } catch (IOException ex) {
            return new ImageStats(0, 0, false);
        }
    }

    private AvatarQualityAssessment analyzeWithVision(String externalUserId, Path photo, String contentType) {
        if (!aiProperties.isChatNetworkConfigured()) {
            return null;
        }
        try {
            String imageBase64 = Base64.getEncoder().encodeToString(Files.readAllBytes(photo));
            String system = """
                    You are a strict but supportive virtual try-on avatar photo QA assistant.
                    Return only compact JSON. Never include markdown.
                    """;
            String user = """
                    Analyze whether this image is suitable as a private avatar for a virtual clothing try-on app.
                    Requirements: exactly one real person, visible full body or at least from head to knees, person should occupy most of the frame, upright orientation, not only a head/portrait, not a tiny figure in a landscape, not multiple people, reasonable lighting.
                    Return JSON:
                    {"quality":"good|usable|needs_new_photo","warnings":["NO_PERSON|MULTIPLE_PEOPLE|HEAD_ONLY|BODY_TOO_SMALL|BUSY_BACKGROUND|SIDEWAYS_OR_UPSIDE_DOWN|POOR_LIGHTING|LOW_DETAIL"],"message":"one short Russian user-facing sentence, supportive tone, no words bad/poor/rejected"}
                    """;
            String raw = noteappAiClient.generateVisionChatText(
                    aiProperties.getSizeComplimentNetwork(),
                    externalUserId,
                    system,
                    user,
                    imageBase64,
                    contentType
            );
            JsonNode json = objectMapper.readTree(stripJson(raw));
            List<String> warnings = new ArrayList<>();
            JsonNode warningNode = json.path("warnings");
            if (warningNode.isArray()) {
                for (JsonNode item : warningNode) {
                    String code = normalizeWarning(item.asText(""));
                    if (code != null) {
                        warnings.add(code);
                    }
                }
            }
            boolean blocking = "needs_new_photo".equalsIgnoreCase(json.path("quality").asText(""));
            String message = json.path("message").asText(null);
            if (message == null || message.isBlank()) {
                message = buildUserMessage(warnings, blocking);
            }
            return new AvatarQualityAssessment(
                    warnings,
                    blocking,
                    blocking ? "Давайте выберем кадр, на котором образ получится точнее" : "Фото подойдёт для примерки",
                    message,
                    blocking ? "replace_photo" : "continue_with_warning"
            );
        } catch (Exception ex) {
            log.warn("Avatar vision quality analysis skipped: {}", ex.getMessage());
            return null;
        }
    }

    private static String stripJson(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.startsWith("```")) {
            value = value.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int start = value.indexOf('{');
        int end = value.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return value.substring(start, end + 1);
        }
        return value;
    }

    private static String normalizeWarning(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "NO_PERSON", "MULTIPLE_PEOPLE", "HEAD_ONLY", "BODY_TOO_SMALL", "BUSY_BACKGROUND",
                    "SIDEWAYS_OR_UPSIDE_DOWN", "POOR_LIGHTING", "LOW_DETAIL", "LANDSCAPE_FRAME", "UNUSUAL_CROP" -> value;
            default -> null;
        };
    }

    private static String buildUserMessage(List<String> warnings, boolean blocking) {
        if (warnings.contains("HEAD_ONLY")) {
            return "Для точной примерки лучше взять кадр в полный рост: так нейросеть сохранит вашу посадку и пропорции.";
        }
        if (warnings.contains("BODY_TOO_SMALL")) {
            return "Выберите кадр, где вы занимаете большую часть фото — образ будет выглядеть заметно точнее.";
        }
        if (warnings.contains("NO_PERSON")) {
            return "Загрузите фото с собой в полный рост — аватар видите только вы, он нужен только для примерки.";
        }
        if (warnings.contains("MULTIPLE_PEOPLE")) {
            return "Лучше выбрать фото, где вы в кадре одни: так примерка не перепутает фигуру.";
        }
        if (warnings.contains("SIDEWAYS_OR_UPSIDE_DOWN")) {
            return "Поверните фото вертикально и загрузите снова — так образ соберётся аккуратнее.";
        }
        if (warnings.contains("BUSY_BACKGROUND")) {
            return "Если фон спокойнее, примерка лучше считывает контур фигуры и одежда садится точнее.";
        }
        if (warnings.contains("LOW_DETAIL")) {
            return "Возьмите более чёткое фото в полный рост — результат будет выглядеть дороже и реалистичнее.";
        }
        if (blocking) {
            return "Для точной примерки нужен кадр в полный рост, где вы хорошо видны и занимаете большую часть фото.";
        }
        if (!warnings.isEmpty()) {
            return "Фото можно использовать, но кадр в полный рост на спокойном фоне даст более точную посадку.";
        }
        return "Фото подходит: аватар останется приватным и будет использоваться только для ваших примерок.";
    }

    private record ImageStats(int width, int height, boolean readable) {
    }

    public record AvatarQualityAssessment(
            List<String> warnings,
            boolean blocking,
            String title,
            String message,
            String recommendedAction
    ) {
    }
}
