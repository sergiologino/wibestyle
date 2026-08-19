package ru.wibestyle.api.marketplace;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class WildberriesSizeExtractor {
    private static final Pattern SIZE_ITEM = Pattern.compile(
            "<li\\b[^>]*class=[\"'][^\"']*sizesListItem[^\"']*[\"'][^>]*>(.*?)</li>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern SIZE_SPAN = Pattern.compile(
            "<span\\b[^>]*class=[\"'][^\"']*sizesListSize(?:Ru)?--[^\"']*[\"'][^>]*>(.*?)</span>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern TAGS = Pattern.compile("<[^>]+>");

    private WildberriesSizeExtractor() {
    }

    public static List<String> extractSizes(String html) {
        if (html == null || html.isBlank()) {
            return List.of();
        }
        Set<String> sizes = new LinkedHashSet<>();
        Matcher itemMatcher = SIZE_ITEM.matcher(html);
        while (itemMatcher.find()) {
            List<String> parts = new ArrayList<>();
            Matcher spanMatcher = SIZE_SPAN.matcher(itemMatcher.group(1));
            while (spanMatcher.find()) {
                String value = clean(spanMatcher.group(1));
                if (!value.isBlank() && parts.stream().noneMatch(value::equalsIgnoreCase)) {
                    parts.add(value);
                }
            }
            if (!parts.isEmpty()) {
                sizes.add(String.join(" / ", parts));
            }
        }
        return new ArrayList<>(sizes);
    }

    private static String clean(String value) {
        return TAGS.matcher(unescape(value)).replaceAll(" ").replaceAll("\\s+", " ").trim();
    }

    private static String unescape(String value) {
        return value
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#34;", "\"")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }
}
