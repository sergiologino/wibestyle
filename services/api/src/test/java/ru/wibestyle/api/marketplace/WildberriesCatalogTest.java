package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class WildberriesCatalogTest {

    @Test
    void resolveBasketHostUsesExtendedVolRanges() {
        assertEquals("https://basket-01.wbbasket.ru", WildberriesCatalog.resolveBasketHost(100));
        assertEquals("https://basket-14.wbbasket.ru", WildberriesCatalog.resolveBasketHost(2082));
        assertEquals("https://basket-17.wbbasket.ru", WildberriesCatalog.resolveBasketHost(2800));
        assertEquals("https://basket-40.wbbasket.ru", WildberriesCatalog.resolveBasketHost(9779));
    }

    @Test
    void buildImageUrlUsesResolvedHost() {
        var restBuilder = org.springframework.web.client.RestClient.builder();
        WildberriesCatalog catalog = new WildberriesCatalog(
                restBuilder,
                new SizeChartExtractor(new ProductPageSizeChartFetcher(restBuilder))
        );
        String url = catalog.buildImageUrl(208285191L, "https://basket-14.wbbasket.ru");
        assertEquals(
                "https://basket-14.wbbasket.ru/vol2082/part208285/208285191/images/big/1.webp",
                url
        );
    }

    @Test
    void basketHostsToTryStartsWithResolvedHost() {
        assertEquals(
                "https://basket-14.wbbasket.ru",
                WildberriesCatalog.basketHostsToTry(2082).get(0)
        );
        assertTrue(WildberriesCatalog.basketHostsToTry(2082).size() > 1);
    }
}
