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
    void buildImageUrlForNewHighBasketShards() {
        WildberriesMediaRules rules = new WildberriesMediaRules();

        assertEquals(
                "https://basket-41.wbbasket.ru/vol10214/part1021495/1021495555/images/big/1.webp",
                rules.buildImageUrl(1021495555L, WildberriesMediaRules.basketHost(41), 1)
        );
        assertEquals(
                "https://basket-42.wbbasket.ru/vol11023/part1102334/1102334647/images/big/1.webp",
                rules.buildImageUrl(1102334647L, WildberriesMediaRules.basketHost(42), 1)
        );
    }

    @Test
    void aiInputCandidatesPreferCompactImageBeforeBigImage() {
        WildberriesMediaRules rules = new WildberriesMediaRules();
        var candidates = rules.aiInputPhotoDownloadCandidates(153241988L, "https://basket-10.wbbasket.ru", 1);
        assertTrue(candidates.get(0).contains("/images/c516x688/1.webp"));
        assertTrue(candidates.stream().anyMatch(candidate -> candidate.contains("/images/big/1.webp")));
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
    @EnabledIfEnvironmentVariable(named = "WB_LIVE_TEST", matches = "1")
    void parsesPhotosFromNewHighBasketShardsLive() {
        WildberriesCatalog catalog = newCatalog();

        byte[] basket41Image = catalog.downloadProductImage(
                "1021495555",
                "https://www.wildberries.ru/catalog/1021495555/detail.aspx"
        );
        byte[] basket42Image = catalog.downloadProductImage(
                "1102334647",
                "https://www.wildberries.ru/catalog/1102334647/detail.aspx"
        );

        org.junit.jupiter.api.Assertions.assertNotNull(basket41Image);
        org.junit.jupiter.api.Assertions.assertNotNull(basket42Image);
        assertTrue(basket41Image.length > 1000);
        assertTrue(basket42Image.length > 1000);
        assertTrue(WildberriesMediaUtils.isProductImageBytes(basket41Image));
        assertTrue(WildberriesMediaUtils.isProductImageBytes(basket42Image));
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
