package ru.wibestyle.api.marketplace;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ProductPageSizeChartFetcher {

    private static final Pattern HTML_TABLE = Pattern.compile(
            "(?is)(<table[^>]*>.*?</table>)"
    );
    private static final Pattern JSON_DESCRIPTION = Pattern.compile(
            "\"description\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\""
    );

    private final RestClient restClient;

    public ProductPageSizeChartFetcher(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public ProductSizeChart fetchFromProductPage(String productUrl) {
        if (productUrl == null || productUrl.isBlank()) {
            return ProductSizeChart.empty();
        }
        try {
            String html = restClient.get()
                    .uri(productUrl)
                    .header("User-Agent", "Mozilla/5.0 (compatible; WibeStyle/1.0)")
                    .retrieve()
                    .body(String.class);
            if (html == null || html.isBlank()) {
                return ProductSizeChart.empty();
            }
            ProductSizeChart fromTables = parseHtmlTables(html);
            if (fromTables.found()) {
                return fromTables;
            }
            Matcher jsonDesc = JSON_DESCRIPTION.matcher(html);
            if (jsonDesc.find()) {
                String unescaped = unescapeJson(jsonDesc.group(1));
                ProductSizeChart parsed = SizeChartTextParser.parse("product_page_json", unescaped);
                if (parsed.found()) {
                    return parsed;
                }
            }
            if (html.toLowerCase().contains("размерн") || html.toLowerCase().contains("обхват груди")) {
                return SizeChartTextParser.parse("product_page_html", html);
            }
        } catch (RestClientException ignored) {
            return ProductSizeChart.empty();
        }
        return ProductSizeChart.empty();
    }

    private static ProductSizeChart parseHtmlTables(String html) {
        Matcher matcher = HTML_TABLE.matcher(html);
        StringBuilder tables = new StringBuilder();
        while (matcher.find()) {
            tables.append(matcher.group(1)).append('\n');
        }
        if (tables.isEmpty()) {
            return ProductSizeChart.empty();
        }
        return SizeChartTextParser.parse("product_page_table", tables.toString());
    }

    private static String unescapeJson(String value) {
        return value
                .replace("\\n", "\n")
                .replace("\\r", "")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\/", "/");
    }
}
