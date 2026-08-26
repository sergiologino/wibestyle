package ru.wibestyle.api.ai;

import org.springframework.stereotype.Component;
import ru.wibestyle.api.service.HairstyleCatalog;

/** Dedicated image-edit prompt: hair is the only permitted edit surface. */
@Component
public class HairstylePromptBuilder {
    public String build(HairstyleCatalog.Style style) {
        return build(style.prompt());
    }
    public String build(String directive) {
        return build(directive, null);
    }
    public String build(String styleDirective, String colorDirective) {
        String style = styleDirective == null || styleDirective.isBlank()
                ? "keep the customer's current haircut, hair length, parting, bangs and styling shape unchanged"
                : styleDirective;
        String color = colorDirective == null || colorDirective.isBlank()
                ? "keep the customer's current hair color unchanged"
                : colorDirective;
        return """
                TASK: virtual hairstyle try-on on a single close-up portrait.
                INPUT RULES: image 1 is the customer portrait and is the sole identity source. Image 2 is an optional hairstyle or hair-color reference only; never copy its face, body, skin, clothes, background, camera angle, or lighting.
                IDENTITY LOCK (highest priority): preserve exactly the customer’s face, facial geometry, eye shape, eyebrows, nose, lips, skin texture and tone, age, expression, ethnicity, pose, head angle, shoulders, clothing, jewellery, background and camera framing. Do not beautify, retouch, age, slim, reshape, swap, crop, zoom, rotate, or alter any non-hair pixels.
                EDIT SCOPE: modify only hair pixels, including existing hair, bangs, parting and hairline. Keep the natural hairline believable. Do not create hats, veils, headbands, text, watermarks, collages, extra people, hands, mirrors, or salon tools.
                STYLE TO APPLY: %s.
                COLOR TO APPLY: %s.
                QUALITY: photorealistic professional salon preview; physically plausible hair density and strands; preserve natural flyaways where appropriate; consistent shadows, colour temperature and sharpness. The result must be one square portrait.
                """.formatted(style, color);
    }
}
