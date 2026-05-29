package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.config.AiIntegrationProperties;

import java.io.IOException;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GarmentClassifierService {

    private static final Logger log = LoggerFactory.getLogger(GarmentClassifierService.class);
    private static final Pattern JSON_BLOCK = Pattern.compile("\\{[^{}]*\"category\"[^{}]*}", Pattern.DOTALL);

    private static final String SYSTEM_PROMPT = """
            You classify a single clothing item in a photo for a virtual try-on app.
            Reply with ONE JSON object only, no markdown:
            {"category":"<slug>","title":"<short Russian name>"}
            category must be one of: dress, top, pants, jacket, shoes, accessory, other
            - dress: dresses, sundresses, gowns
            - top: t-shirts, blouses, shirts, sweaters, hoodies, tops
            - pants: trousers, jeans, leggings, shorts, skirts as bottom
            - jacket: coats, jackets, blazers, cardigans worn as outer layer
            - shoes: footwear
            - accessory: bags, hats, belts, scarves, jewelry
            - other: if unclear or multiple items
            title: concise Russian product name (2-5 words), e.g. "Платье миди", "Куртка oversize".
            """;

    private final NoteappAiClient noteappAiClient;
    private final AiIntegrationProperties aiProperties;
    private final ObjectMapper objectMapper;

    public GarmentClassifierService(
            NoteappAiClient noteappAiClient,
            AiIntegrationProperties aiProperties,
            ObjectMapper objectMapper
    ) {
        this.noteappAiClient = noteappAiClient;
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
    }

    public GarmentClassification classify(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("PHOTO_REQUIRED");
        }

        GarmentClassification fallback = fallbackFromFilename(photo.getOriginalFilename());
        if (!aiProperties.isChatNetworkConfigured()) {
            return fallback;
        }

        try {
            String mimeType = photo.getContentType() == null ? "image/jpeg" : photo.getContentType();
            String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
            String response = noteappAiClient.generateVisionChatText(
                    aiProperties.getSizeComplimentNetwork(),
                    SYSTEM_PROMPT,
                    "What clothing item is shown? Return JSON only.",
                    base64,
                    mimeType
            );
            GarmentClassification parsed = parseResponse(response);
            if (parsed != null) {
                return new GarmentClassification(parsed.category(), parsed.title(), "ai");
            }
        } catch (Exception ex) {
            log.warn("Garment vision classify failed, using fallback: {}", ex.getMessage());
        }
        return fallback;
    }

    GarmentClassification parseResponse(String response) {
        if (response == null || response.isBlank()) {
            return null;
        }
        String trimmed = response.trim();
        try {
            return fromJsonNode(objectMapper.readTree(trimmed));
        } catch (Exception ignored) {
            // try extract JSON substring
        }

        Matcher matcher = JSON_BLOCK.matcher(trimmed);
        if (matcher.find()) {
            try {
                return fromJsonNode(objectMapper.readTree(matcher.group()));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private GarmentClassification fromJsonNode(JsonNode node) {
        if (node == null || node.isMissingNode()) {
            return null;
        }
        String category = node.path("category").asText(null);
        String title = node.path("title").asText(null);
        if (category == null && title == null) {
            return null;
        }
        return new GarmentClassification(category, title, "ai");
    }

    private static GarmentClassification fallbackFromFilename(String filename) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        String category = "other";
        String title = "Одежда";

        if (lower.contains("dress") || lower.contains("plat")) {
            category = "dress";
            title = "Платье";
        } else if (lower.contains("shoe") || lower.contains("obuv") || lower.contains("boot")) {
            category = "shoes";
            title = "Обувь";
        } else if (lower.contains("jacket") || lower.contains("pidzh") || lower.contains("coat")) {
            category = "jacket";
            title = "Пиджак";
        } else if (lower.contains("pant") || lower.contains("jean") || lower.contains("bruk")) {
            category = "pants";
            title = "Брюки";
        } else if (lower.contains("shirt") || lower.contains("top") || lower.contains("blouse")) {
            category = "top";
            title = "Верх";
        }

        return new GarmentClassification(category, title, "fallback");
    }
}
