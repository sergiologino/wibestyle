package ru.wibestyle.api.search;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SearchQueryUnderstandingService {

    private static final Pattern YEAR = Pattern.compile("\\b(20\\d{2})\\b");

    public ParsedQuery parse(String query) {
        String lower = query.toLowerCase(Locale.ROOT);
        Map<String, Object> facets = new HashMap<>();

        facets.put("category", detectCategory(lower));
        facets.put("season", detectSeason(lower));
        facets.put("styleIntent", detectStyleIntent(lower));
        facets.put("gender", detectGender(lower));
        facets.put("year", detectYear(query));

        String expanded = expandQuery(query, facets);
        return new ParsedQuery(query.trim(), expanded, facets);
    }

    private String detectCategory(String lower) {
        if (containsAny(lower, "пиджак", "blazer", "jacket")) return "jacket";
        if (containsAny(lower, "платье", "dress")) return "dress";
        if (containsAny(lower, "брюки", "pants", "джинс")) return "pants";
        if (containsAny(lower, "обув", "shoe", "кросс")) return "shoes";
        if (containsAny(lower, "блуз", "top", "футбол")) return "top";
        return "other";
    }

    private String detectSeason(String lower) {
        if (containsAny(lower, "лето", "summer", "летн")) return "summer";
        if (containsAny(lower, "зим", "winter")) return "winter";
        if (containsAny(lower, "весн", "spring")) return "spring";
        if (containsAny(lower, "осен", "autumn", "fall")) return "autumn";
        return null;
    }

    private String detectStyleIntent(String lower) {
        if (containsAny(lower, "модн", "тренд", "trend", "fashion")) return "fashion_trend";
        if (containsAny(lower, "офис", "office", "делов")) return "office";
        if (containsAny(lower, "casual", "повседн")) return "casual";
        return null;
    }

    private String detectGender(String lower) {
        if (containsAny(lower, "мужск", "men")) return "male";
        if (containsAny(lower, "женск", "women")) return "female";
        return null;
    }

    private Integer detectYear(String query) {
        Matcher matcher = YEAR.matcher(query);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    private String expandQuery(String query, Map<String, Object> facets) {
        StringBuilder sb = new StringBuilder(query.trim());
        Object category = facets.get("category");
        if ("jacket".equals(category)) sb.append(" oversize blazer");
        if ("dress".equals(category)) sb.append(" midi dress");
        Object season = facets.get("season");
        if ("summer".equals(season)) sb.append(" lightweight breathable");
        return sb.toString().trim();
    }

    private boolean containsAny(String text, String... tokens) {
        for (String token : tokens) {
            if (text.contains(token)) return true;
        }
        return false;
    }

    public record ParsedQuery(String originalQuery, String expandedQuery, Map<String, Object> facets) {
    }
}
