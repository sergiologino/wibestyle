package ru.wibestyle.api.marketplace;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MarketplaceUrlNormalizer {

    private static final Pattern HTTP_URL = Pattern.compile("https?://[^\\s<>\"']+", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAILING_PUNCTUATION = Pattern.compile("[.,;:!?\\)\\]\\}]+$");

    private MarketplaceUrlNormalizer() {
    }

    public static String extract(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        Matcher matcher = HTTP_URL.matcher(trimmed);
        if (!matcher.find()) {
            return trimmed;
        }
        return TRAILING_PUNCTUATION.matcher(matcher.group()).replaceAll("");
    }
}
