package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WildberriesBasketResolver {

    static final int DEFAULT_MAX_BASKET_NUMBER = 80;
    static final int DEFAULT_RESOLVE_BUDGET_MILLIS = 6_000;
    private static final String MAX_BASKET_NUMBER_PROPERTY = "wibestyle.wb.maxBasket";
    private static final String RESOLVE_BUDGET_MILLIS_PROPERTY = "wibestyle.wb.resolveBudgetMillis";
    private static final int REQUEST_CONNECT_TIMEOUT_MILLIS = 800;
    private static final int REQUEST_READ_TIMEOUT_MILLIS = 1_200;

    private final RestClient restClient;
    private final WildberriesMediaRules mediaRules;

    public WildberriesBasketResolver(RestClient.Builder restClientBuilder, WildberriesMediaRules mediaRules) {
        this.restClient = restClientBuilder.clone()
                .requestFactory(shortRequestFactory())
                .defaultHeader("User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .defaultHeader("Accept", "application/json")
                .build();
        this.mediaRules = mediaRules;
    }

    public Optional<ResolvedBasketCard> resolveCard(long article) {
        long vol = article / 100_000;
        long deadlineNanos = System.nanoTime() + configuredResolveBudgetMillis() * 1_000_000L;
        for (String host : orderedBasketHosts(vol)) {
            if (System.nanoTime() >= deadlineNanos) {
                return Optional.empty();
            }
            Optional<ResolvedBasketCard> resolved = fetchCardJson(article, host);
            if (resolved.isPresent()) {
                return resolved;
            }
        }
        return Optional.empty();
    }

    public Optional<String> resolveBasketHost(long article) {
        return resolveCard(article).map(ResolvedBasketCard::host);
    }

    private Optional<ResolvedBasketCard> fetchCardJson(long article, String host) {
        String cardUrl = mediaRules.buildCardJsonUrl(article, host);
        try {
            JsonNode card = restClient.get().uri(cardUrl).retrieve().body(JsonNode.class);
            if (card == null || card.isMissingNode() || card.path("nm_id").asLong(0) != article) {
                return Optional.empty();
            }
            return Optional.of(new ResolvedBasketCard(host, card));
        } catch (RestClientException ignored) {
            return Optional.empty();
        }
    }

    /**
     * Heuristic basket first, then spiral outward (vol ranges drift; card.json is source of truth).
     */
    static List<String> orderedBasketHosts(long vol) {
        int heuristic = heuristicBasketNumber(vol);
        int maxBasketNumber = Math.max(configuredMaxBasketNumber(), heuristic);
        List<Integer> order = new ArrayList<>();
        order.add(heuristic);
        for (int delta = 1; delta <= maxBasketNumber; delta++) {
            int lower = heuristic - delta;
            if (lower >= WildberriesMediaRules.MIN_BASKET_NUMBER) {
                order.add(lower);
            }
            int upper = heuristic + delta;
            if (upper <= maxBasketNumber) {
                order.add(upper);
            }
        }
        List<String> hosts = new ArrayList<>();
        for (int basket : order) {
            String host = WildberriesMediaRules.BASKET_HOST_TEMPLATE.formatted(basket);
            if (!hosts.contains(host)) {
                hosts.add(host);
            }
        }
        return hosts;
    }

    static int heuristicBasketNumber(long vol) {
        String host = WildberriesCatalog.resolveBasketHost(vol);
        int dash = host.lastIndexOf('-');
        int dot = host.indexOf('.', dash);
        if (dash < 0 || dot <= dash) {
            return 1;
        }
        return Integer.parseInt(host.substring(dash + 1, dot));
    }

    private static int configuredMaxBasketNumber() {
        return Integer.getInteger(MAX_BASKET_NUMBER_PROPERTY, DEFAULT_MAX_BASKET_NUMBER);
    }

    private static int configuredResolveBudgetMillis() {
        return Integer.getInteger(RESOLVE_BUDGET_MILLIS_PROPERTY, DEFAULT_RESOLVE_BUDGET_MILLIS);
    }

    private static SimpleClientHttpRequestFactory shortRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(REQUEST_CONNECT_TIMEOUT_MILLIS);
        factory.setReadTimeout(REQUEST_READ_TIMEOUT_MILLIS);
        return factory;
    }

    public record ResolvedBasketCard(String host, JsonNode card) {
    }
}
