package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

class WildberriesCatalogTest {

    private static WildberriesCatalog newCatalog() {
        var restBuilder = org.springframework.web.client.RestClient.builder();
        WildberriesMediaRules mediaRules = new WildberriesMediaRules();
        return new WildberriesCatalog(
                restBuilder,
                new SizeChartExtractor(new ProductPageSizeChartFetcher(restBuilder)),
                new WildberriesBasketResolver(restBuilder, mediaRules),
                mediaRules
        );
    }

    @Test
    void resolveBasketHostUsesExtendedVolRanges() {
        assertEquals("https://basket-01.wbbasket.ru", WildberriesCatalog.resolveBasketHost(100));
        assertEquals("https://basket-14.wbbasket.ru", WildberriesCatalog.resolveBasketHost(2082));
        assertEquals("https://basket-17.wbbasket.ru", WildberriesCatalog.resolveBasketHost(2800));
        assertEquals("https://basket-40.wbbasket.ru", WildberriesCatalog.resolveBasketHost(9779));
        assertEquals("https://basket-39.wbbasket.ru", WildberriesCatalog.resolveBasketHost(7457));
    }

    @Test
    void buildImageUrlUsesResolvedHost() {
        WildberriesCatalog catalog = newCatalog();
        String url = catalog.buildImageUrl(208285191L, "https://basket-14.wbbasket.ru");
        assertEquals(
                "https://basket-14.wbbasket.ru/vol2082/part208285/208285191/images/big/1.webp",
                url
        );
        assertFalse(WildberriesMediaUtils.isVideoMediaUrl(url));
    }

    @Test
    void buildImageUrlForArticle745716141UsesBasket35Path() {
        WildberriesMediaRules rules = new WildberriesMediaRules();
        String url = rules.buildImageUrl(
                745716141L,
                "https://basket-35.wbbasket.ru",
                1
        );
        assertEquals(
                "https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/big/1.webp",
                url
        );
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "WB_LIVE_TEST", matches = "1")
    void downloadsPhotoForVideoFirstProduct745716141Live() {
        byte[] image = newCatalog().downloadProductImage("745716141");
        org.junit.jupiter.api.Assertions.assertNotNull(image);
        assertTrue(image.length > 1000);
        assertTrue(WildberriesMediaUtils.isProductImageBytes(image));
    }

    @Test
    void basketHostsToTryStartsWithHeuristicHost() {
        assertEquals(
                "https://basket-14.wbbasket.ru",
                WildberriesCatalog.basketHostsToTry(2082).get(0)
        );
        assertTrue(WildberriesCatalog.basketHostsToTry(2082).size() > 1);
    }
}
