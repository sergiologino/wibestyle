package ru.wibestyle.api.marketplace;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts size→measurement rows from seller description / HTML tables (RU marketplace cards).
 */
public final class SizeChartTextParser {

    private static final Pattern SIZE_ROW = Pattern.compile(
            "(?i)^\\s*([XSML0-9]{1,4}|\\d{2})\\s+"
                    + "(\\d{2,3})\\s*[-–—]\\s*(\\d{2,3})\\s+"
                    + "(\\d{2,3})\\s*[-–—]\\s*(\\d{2,3})"
                    + "(?:\\s+(\\d{2,3})\\s*[-–—]\\s*(\\d{2,3}))?"
    );

    private static final Pattern SIZE_ROW_ALT = Pattern.compile(
            "(?i)([XSML]{1,3}|\\d{2})\\s*[:|]\\s*"
                    + "(?:груд[ьи]?|bust)\\s*[:=]?\\s*(\\d{2,3})\\s*[-–—]\\s*(\\d{2,3})"
    );

    private SizeChartTextParser() {
    }

    public static ProductSizeChart parse(String source, String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return ProductSizeChart.empty();
        }
        String normalized = normalize(rawText);
        List<SizeChartEntry> entries = new ArrayList<>();
        entries.addAll(parseTableRows(normalized));
        entries.addAll(parseInlineRows(normalized));
        if (entries.isEmpty()) {
            return ProductSizeChart.empty();
        }
        return new ProductSizeChart(true, source, dedupe(entries));
    }

    private static List<SizeChartEntry> parseTableRows(String text) {
        List<SizeChartEntry> rows = new ArrayList<>();
        for (String line : text.split("\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            Matcher matcher = SIZE_ROW.matcher(trimmed.replace('|', ' ').replace('\t', ' '));
            if (!matcher.find()) {
                continue;
            }
            String label = matcher.group(1).toUpperCase(Locale.ROOT);
            Integer bustMin = parseInt(matcher.group(2));
            Integer bustMax = parseInt(matcher.group(3));
            Integer waistMin = parseInt(matcher.group(4));
            Integer waistMax = parseInt(matcher.group(5));
            Integer hipsMin = matcher.groupCount() >= 7 ? parseInt(matcher.group(6)) : null;
            Integer hipsMax = matcher.groupCount() >= 7 ? parseInt(matcher.group(7)) : null;
            rows.add(new SizeChartEntry(label, bustMin, bustMax, waistMin, waistMax, hipsMin, hipsMax));
        }
        return rows;
    }

    private static List<SizeChartEntry> parseInlineRows(String text) {
        List<SizeChartEntry> rows = new ArrayList<>();
        Matcher matcher = SIZE_ROW_ALT.matcher(text);
        while (matcher.find()) {
            rows.add(new SizeChartEntry(
                    matcher.group(1).toUpperCase(Locale.ROOT),
                    parseInt(matcher.group(2)),
                    parseInt(matcher.group(3)),
                    null,
                    null,
                    null,
                    null
            ));
        }
        return rows;
    }

    private static String normalize(String raw) {
        String text = raw
                .replace("<br>", "\n")
                .replace("<br/>", "\n")
                .replace("<br />", "\n")
                .replace("</tr>", "\n")
                .replace("</td>", " ")
                .replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ");
        if (text.toLowerCase(Locale.ROOT).contains("размерн") || text.toLowerCase(Locale.ROOT).contains("обхват")) {
            return text;
        }
        return text;
    }

    private static List<SizeChartEntry> dedupe(List<SizeChartEntry> entries) {
        Map<String, SizeChartEntry> map = new LinkedHashMap<>();
        for (SizeChartEntry entry : entries) {
            map.putIfAbsent(entry.label(), entry);
        }
        return List.copyOf(map.values());
    }

    private static Integer parseInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
