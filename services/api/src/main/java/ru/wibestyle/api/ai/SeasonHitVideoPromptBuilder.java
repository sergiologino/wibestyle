package ru.wibestyle.api.ai;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class SeasonHitVideoPromptBuilder {

    public String buildPrompt(String garmentCategory, String productTitle) {
        String location = resolveLocation(garmentCategory, productTitle);
        return """
                Create a creative cinematic fashion video featuring the person from the reference photo wearing the exact outfit shown.
                Studio-quality lighting, smooth camera movement, shallow depth of field, premium fashion film aesthetic.
                Location: %s.
                The person should move naturally with confident model poses — subtle turn, walk, or gentle motion.
                Keep the face, body proportions, and clothing identical to the reference image.
                No text overlays, no logos, no watermarks. Vertical 3:4 framing.
                """.formatted(location).trim();
    }

    private String resolveLocation(String garmentCategory, String productTitle) {
        String haystack = ((garmentCategory == null ? "" : garmentCategory) + " "
                + (productTitle == null ? "" : productTitle)).toLowerCase(Locale.ROOT);

        if (matchesAny(haystack, "пижам", "pajama", "pyjama", "nightshirt", "nightgown", "nightwear",
                "sleepwear", "ночн", "сорочк", "бель", "lingerie", "homewear sleep", "night dress")) {
            return "an elegant cozy bedroom with soft warm ambient light and tasteful interior decor";
        }

        if ("jacket".equals(garmentCategory) || matchesAny(haystack, "куртк", "пальто", "пухов", "парка",
                "ветровк", "outerwear", "coat", "down jacket", "parka", "windbreaker")) {
            if (matchesAny(haystack, "зим", "winter", "утепл", "мех", "пух", "шерст", "флис", "fleece", "wool")) {
                return "a stylish snowy city street in winter with soft golden hour light and falling snow";
            }
            return "a vibrant sunny city street in summer with natural daylight and urban fashion atmosphere";
        }

        if ("shoes".equals(garmentCategory) || matchesAny(haystack, "обув", "sneaker", "boot", "loafer")) {
            return "a fashionable urban sidewalk scene with cinematic daylight and lifestyle energy";
        }

        if (matchesAny(haystack, "офис", "office", "business", "делов", "blazer", "костюм", "suit")) {
            return "a modern premium office interior with clean lines and professional atmosphere";
        }

        if (matchesAny(haystack, "домаш", "homewear", "lounge", "casual home", "housewear", "халат", "robe")) {
            return "a beautiful bright living room with designer interior and soft natural window light";
        }

        return "a luxurious minimalist interior with large windows and refined ambient lighting";
    }

    private static boolean matchesAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
