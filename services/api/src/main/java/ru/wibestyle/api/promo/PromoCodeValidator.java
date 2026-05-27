package ru.wibestyle.api.promo;

public final class PromoCodeValidator {

    private PromoCodeValidator() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toUpperCase();
    }

    public static void validateFormat(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("PROMO_REQUIRED");
        }
        if (containsCyrillicHomoglyphs(raw)) {
            throw new IllegalArgumentException("PROMO_CYRILLIC_KEYBOARD");
        }
        String normalized = normalize(raw);
        if (!normalized.matches("[A-Z0-9]+")) {
            throw new IllegalArgumentException("PROMO_INVALID_FORMAT");
        }
        if (normalized.length() < 3 || normalized.length() > 32) {
            throw new IllegalArgumentException("PROMO_INVALID_FORMAT");
        }
    }

    public static boolean containsCyrillicHomoglyphs(String value) {
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch >= '\u0400' && ch <= '\u04FF') {
                return true;
            }
        }
        return false;
    }

    public static String generateCode(int length) {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * alphabet.length());
            builder.append(alphabet.charAt(index));
        }
        return builder.toString();
    }
}
