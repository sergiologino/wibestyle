package ru.wibestyle.api.marketplace;

import org.springframework.stereotype.Component;
import ru.wibestyle.api.domain.TryOnErrorCodes;

import java.util.List;

@Component
public class MarketplaceAdapterRegistry {

    private final List<MarketplaceAdapter> adapters;

    public MarketplaceAdapterRegistry(List<MarketplaceAdapter> adapters) {
        this.adapters = adapters;
    }

    public MarketplaceAdapter resolve(String url) {
        return adapters.stream()
                .filter(adapter -> adapter.canHandle(url))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(TryOnErrorCodes.MARKETPLACE_UNSUPPORTED));
    }
}
