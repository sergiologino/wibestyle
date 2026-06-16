package ru.wibestyle.api.ai;

/**
 * Identity lock for virtual try-on prompts. This block is duplicated at the
 * beginning and end of the final prompt and is also included in JSON variables.
 */
public final class FaceLockPromptBuilder {

    private FaceLockPromptBuilder() {
    }

    public static String build() {
        return """
                FACE AND IDENTITY LOCK, HIGHEST PRIORITY:
                image1 is the only identity source. Preserve the customer's face, head shape, hair, hairstyle,
                hair color, skin tone, age impression, neck, hands, body proportions, height impression and pose from image1.
                image2 is only a garment reference. If image2 contains a seller model, mannequin or person, completely ignore
                that person's face, head, hair, skin, body, limbs, pose and identity.
                FORBIDDEN: copying, blending, averaging or replacing the customer with the seller model from image2.
                FORBIDDEN: using image2 body proportions, face, head, hair, legs, hands or pose as the result person.
                Allowed from image2: garment color, fabric, cut, silhouette, print, texture, closures and small clothing details only.
                Repeat: the final person must be recognizable as image1, wearing only the garment from image2.
                """.trim().replaceAll("\\s+", " ");
    }
}
