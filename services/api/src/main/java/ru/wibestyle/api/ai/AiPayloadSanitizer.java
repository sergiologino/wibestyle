package ru.wibestyle.api.ai;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AiPayloadSanitizer {

    private AiPayloadSanitizer() {
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> sanitize(Map<String, Object> payload) {
        if (payload == null) {
            return Map.of();
        }
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            out.put(entry.getKey(), sanitizeValue(entry.getKey(), entry.getValue()));
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static Object sanitizeValue(String key, Object value) {
        if (value == null) {
            return null;
        }
        if (isBase64Field(key) && value instanceof String str) {
            return base64Hint(str);
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> nested = new LinkedHashMap<>();
            for (Map.Entry<?, ?> e : map.entrySet()) {
                nested.put(String.valueOf(e.getKey()), sanitizeValue(String.valueOf(e.getKey()), e.getValue()));
            }
            return nested;
        }
        if (value instanceof List<?> list) {
            List<Object> sanitized = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    Map<String, Object> cast = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> e : m.entrySet()) {
                        cast.put(String.valueOf(e.getKey()), e.getValue());
                    }
                    sanitized.add(sanitize(cast));
                } else if (item instanceof String s && looksLikeBase64(s)) {
                    sanitized.add(base64Hint(s));
                } else {
                    sanitized.add(item);
                }
            }
            return sanitized;
        }
        if (value instanceof String str && looksLikeBase64(str)) {
            return base64Hint(str);
        }
        return value;
    }

    private static boolean isBase64Field(String key) {
        if (key == null) {
            return false;
        }
        String lower = key.toLowerCase();
        return lower.contains("base64") || lower.contains("image") && lower.contains("person")
                || lower.contains("garment") && lower.contains("image");
    }

    private static boolean looksLikeBase64(String value) {
        if (value == null || value.length() < 256) {
            return false;
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("data:image/") && trimmed.length() > 400) {
            return true;
        }
        return trimmed.length() > 2000 && trimmed.matches("^[A-Za-z0-9+/=\\s]+$");
    }

    private static String base64Hint(String value) {
        return "[base64, символов=" + (value != null ? value.length() : 0) + "]";
    }
}
