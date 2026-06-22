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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GarmentClassifierService {

    private static final Logger log = LoggerFactory.getLogger(GarmentClassifierService.class);
    private static final Pattern JSON_BLOCK = Pattern.compile("\\{[^{}]*\"category\"[^{}]*}", Pattern.DOTALL);

    private static final String SYSTEM_PROMPT = """
            You classify a single clothing item in a photo for a virtual try-on app.
            Reply with ONE JSON object only, no markdown:
            {"category":"<slug>","title":"<short product name>","promptProfile":"<slug>","coverageLevel":"<slug>","moderationRisk":"<slug>","hasHumanModel":true}
            category must be one of: dress, top, pants, jacket, shoes, accessory, underwear, sleepwear, swimwear, other
            - dress: dresses, sundresses, gowns
            - top: t-shirts, blouses, shirts, sweaters, hoodies, tops
            - pants: trousers, jeans, leggings, shorts, skirts as bottom
            - jacket: coats, jackets, blazers, cardigans worn as outer layer
            - shoes: footwear
            - accessory: bags, hats, belts, scarves, jewelry
            - underwear: underwear, lingerie, bras, panties, shapewear
            - sleepwear: pajamas, nightgowns, robes, home sleep clothes
            - swimwear: swimsuits, bikinis, swim trunks
            - other: if unclear or multiple items
            promptProfile must be one of: standard, dress, outerwear, bottom, shoes, accessory, revealing_safe, homewear_safe
            coverageLevel must be one of: normal, revealing, intimate
            moderationRisk must be one of: low, medium, high
            hasHumanModel is true when a person/model/mannequin body is visible in the product photo.
            title: concise product name (2-5 words), e.g. "Midi dress", "Oversize jacket".
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
        return classifyBytes(
                photo.getBytes(),
                photo.getContentType() == null ? "image/jpeg" : photo.getContentType(),
                fallbackFromText(photo.getOriginalFilename(), null)
        );
    }

    public GarmentClassification classifyBytes(byte[] bytes, String mimeType, GarmentClassification fallback) {
        GarmentClassification resolvedFallback = fallback == null
                ? conservativeFallback(new GarmentClassification("other", null, "fallback"))
                : conservativeFallback(fallback);
        if (bytes == null || bytes.length == 0 || !aiProperties.isChatNetworkConfigured()) {
            return resolvedFallback;
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String response = noteappAiClient.generateVisionChatText(
                    aiProperties.getSizeComplimentNetwork(),
                    SYSTEM_PROMPT,
                    "What clothing item is shown? Return JSON only.",
                    base64,
                    mimeType == null || mimeType.isBlank() ? "image/jpeg" : mimeType
            );
            GarmentClassification parsed = parseResponse(response);
            if (parsed != null) {
                boolean hasHumanModel = parsed.hasHumanModel() || "other".equals(parsed.category());
                return new GarmentClassification(
                        parsed.category(),
                        parsed.title(),
                        "ai",
                        parsed.promptProfile(),
                        parsed.coverageLevel(),
                        parsed.moderationRisk(),
                        hasHumanModel
                );
            }
        } catch (Exception ex) {
            log.warn("Garment vision classify failed, using fallback: {}", ex.getMessage());
        }
        return resolvedFallback;
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
        return new GarmentClassification(
                category,
                title,
                "ai",
                node.path("promptProfile").asText(null),
                node.path("coverageLevel").asText(null),
                node.path("moderationRisk").asText(null),
                node.path("hasHumanModel").asBoolean(false)
        );
    }

    public GarmentClassification fallbackFromText(String text, String defaultTitle) {
        String lower = text == null ? "" : text.toLowerCase(Locale.ROOT).replace('ё', 'е');
        String category = "other";
        String title = defaultTitle == null || defaultTitle.isBlank() ? "Garment" : defaultTitle.trim();

        if (containsAny(lower, "underwear", "lingerie", "bra", "panties", "бель", "бюстгальтер", "трусы")) {
            category = "underwear";
            title = "Underwear";
        } else if (containsAny(lower, "sleep", "pajama", "night", "пижам", "ночн", "халат")) {
            category = "sleepwear";
            title = "Sleepwear";
        } else if (containsAny(lower, "swim", "bikini", "купаль", "пляж")) {
            category = "swimwear";
            title = "Swimwear";
        } else if (containsAny(lower, "dress", "plat", "плать", "сарафан")) {
            category = "dress";
            title = "Dress";
        } else if (containsAny(lower, "shoe", "obuv", "boot", "обув", "ботин", "кроссов", "туфл")) {
            category = "shoes";
            title = "Shoes";
        } else if (containsAny(lower, "jacket", "pidzh", "coat", "куртк", "пидж", "пальто", "кардиган")) {
            category = "jacket";
            title = "Outerwear";
        } else if (containsAny(lower, "pant", "jean", "bruk", "брюк", "джинс", "юбк", "шорт")) {
            category = "pants";
            title = "Bottom garment";
        } else if (containsAny(lower, "shirt", "top", "blouse", "рубаш", "блуз", "футбол", "свитер", "худи")) {
            category = "top";
            title = "Top garment";
        }

        return conservativeFallback(new GarmentClassification(category, title, "fallback"));
    }

    private static GarmentClassification conservativeFallback(GarmentClassification classification) {
        if (classification == null || classification.hasHumanModel()) {
            return classification;
        }
        return new GarmentClassification(
                classification.category(),
                classification.title(),
                classification.source(),
                classification.promptProfile(),
                classification.coverageLevel(),
                classification.moderationRisk(),
                true
        );
    }

    private static boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
