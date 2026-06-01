package ru.wibestyle.api.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WildberriesBasketResolver {

    private final RestClient restClient;
    private final WildberriesMediaRules mediaRules;

    public WildberriesBasketResolver(RestClient.Builder restClientBuilder, WildberriesMediaRules mediaRules) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .defaultHeader("Accept", "application/json")
                .build();
        this.mediaRules = mediaRules;
    }

    public Optional<ResolvedBasketCard> resolveCard(long article) {
        long vol = article / 100_000;
        for (String host : orderedBasketHosts(vol)) {
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
        List<Integer> order = new ArrayList<>();
        order.add(heuristic);
        for (int delta = 1; delta <= 40; delta++) {
            int lower = heuristic - delta;
            if (lower >= 1) {
                order.add(lower);
            }
            int upper = heuristic + delta;
            if (upper <= 40) {
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

    public record ResolvedBasketCard(String host, JsonNode card) {
    }
}
