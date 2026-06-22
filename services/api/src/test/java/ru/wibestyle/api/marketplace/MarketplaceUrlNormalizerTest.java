package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class MarketplaceUrlNormalizerTest {

    @Test
    void extractsUrlFromMarketplaceShareText() {
        assertEquals(
                "https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN",
                MarketplaceUrlNormalizer.extract(
                        "Летний костюм 2 в 1 https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN"
                )
        );
    }

    @Test
    void removesTrailingMessagePunctuation() {
        assertEquals(
                "https://www.ozon.ru/product/plate-3731731230/",
                MarketplaceUrlNormalizer.extract("Товар: https://www.ozon.ru/product/plate-3731731230/).")
        );
    }
}
