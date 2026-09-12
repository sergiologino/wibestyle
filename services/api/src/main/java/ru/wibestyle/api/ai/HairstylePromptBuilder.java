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
                INPUT RULES: image 1 is the customer portrait and is the sole identity source. Image 2 is the primary selected reference: hairstyle reference when a hairstyle is selected, otherwise hair-color reference. Image 3, when present, is the selected hair-color reference only. Never copy face, body, skin, clothes, background, camera angle, or lighting from reference images.
                IDENTITY LOCK (highest priority): preserve exactly the customer’s face, facial geometry, eye shape, eyebrows, nose, lips, skin texture and tone, age, expression, ethnicity, pose, head angle, shoulders, clothing, jewellery, background and camera framing. Do not beautify, retouch, age, slim, reshape, swap, crop, zoom, rotate, or alter any non-hair pixels.
                EDIT SCOPE: modify only hair pixels, including existing hair, bangs, parting and hairline. Keep the natural hairline believable. Do not create hats, veils, headbands, text, watermarks, collages, extra people, hands, mirrors, or salon tools.
                STYLE TO APPLY: %s.
                COLOR TO APPLY: %s.
                QUALITY: photorealistic professional salon preview; physically plausible hair density and strands; preserve natural flyaways where appropriate; consistent shadows, colour temperature and sharpness. The result must be one square portrait.
                """.formatted(style, color);
    }

    public String buildAfterTryOnCombo(String styleDirective, String colorDirective, boolean hasStyleReference, boolean hasColorReference) {
        String style = styleDirective == null || styleDirective.isBlank()
                ? "keep the haircut shape, hair length, parting, bangs and styling shape already visible on image 1"
                : styleDirective;
        String color = colorDirective == null || colorDirective.isBlank()
                ? "keep the hair color already visible on image 1"
                : colorDirective;
        String referenceRules = hasStyleReference && hasColorReference
                ? "image 2 is ONLY a haircut-shape reference; image 3 is ONLY a hair-color/texture reference."
                : "image 2 is ONLY the customer's portrait/hairline reference; image 3 is ONLY the selected haircut or hair-color reference.";
        String applyRules = hasStyleReference && hasColorReference
                ? "Apply the haircut silhouette, length, bangs and contour from image 2, and apply the hair color/texture from image 3."
                : "Apply only the selected hair change from image 3, using image 2 only for customer identity/hairline consistency.";
        return """
                TASK: hair-only edit on an existing completed clothing try-on result.
                OUTPUT CANVAS LOCK (highest priority): image 1 is the final canvas and the only source for the output person, face, body, outfit, pose, hands, legs, shoes, background, lighting, camera angle, crop and framing. The output must keep image 1 composition. If image 1 is full-body or three-quarter, the result must remain full-body or three-quarter. Do not turn the result into a close-up portrait unless image 1 is already a close-up portrait.
                INPUT RULES: %s Reference images are visual guides only. Never copy or blend any reference model's face, skin, body, clothing, hands, pose, background, camera angle, crop or identity into the result.
                IDENTITY LOCK: preserve exactly the person from image 1: face geometry, eyes, eyebrows, nose, lips, skin texture and tone, age, expression, body proportions, visible clothing, jewellery, hands and background. Do not beautify, retouch, slim, reshape, swap, crop, zoom, rotate, or replace any non-hair pixels.
                EDIT SCOPE: modify only hair pixels on the person from image 1, including hair length, bangs, parting, contour, hairline and hair color. Keep the hairline believable on the image 1 head. Do not create hats, veils, headbands, text, watermarks, collages, extra people, mirrors, salon tools, or a new studio portrait.
                STYLE TO APPLY: %s.
                COLOR TO APPLY: %s.
                APPLICATION RULE: %s Never output the hairstyle catalogue model. Never use a reference image as the base image. The result must be image 1 with only the requested hair change applied.
                QUALITY: photorealistic professional salon preview; physically plausible hair density and strands; consistent shadows, colour temperature, perspective and sharpness with image 1.
                """.formatted(referenceRules, style, color, applyRules);
    }
}
