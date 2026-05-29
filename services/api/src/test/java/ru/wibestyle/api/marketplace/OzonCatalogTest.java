package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class OzonCatalogTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractNumericSkuFromSlug() {
        assertEquals("2154046881", OzonCatalog.extractNumericSku("komplekt-odezhdy-soul-key-2154046881"));
        assertEquals("2154046881", OzonCatalog.extractNumericSku("2154046881"));
    }

    @Test
    void extractSlugFromProductUrl() {
        assertEquals(
                "komplekt-odezhdy-soul-key-2154046881",
                OzonCatalog.extractSlug("https://www.ozon.ru/product/komplekt-odezhdy-soul-key-2154046881/?at=abc")
        );
        assertEquals("2154046881", OzonCatalog.extractSlug("https://www.ozon.ru/context/detail/id/2154046881/"));
    }

    @Test
    void normalizeImageUrlAddsHttpsScheme() {
        assertEquals(
                "https://ir.ozone.ru/s3/multimedia-1/test.webp",
                OzonCatalog.normalizeImageUrl("//ir.ozone.ru/s3/multimedia-1/test.webp")
        );
    }

    @Test
    void parseComposerProductFixture() throws Exception {
        JsonNode root;
        try (InputStream input = getClass().getResourceAsStream("/marketplace/ozon-composer-product.json")) {
            root = objectMapper.readTree(input);
        }

        Optional<OzonCatalog.OzonProductCard> card = OzonCatalog.parseComposerPage(
                root,
                "komplekt-odezhdy-soul-key-2154046881",
                "https://www.ozon.ru/product/komplekt-odezhdy-soul-key-2154046881/"
        );

        assertTrue(card.isPresent());
        assertEquals("2154046881", card.get().productId());
        assertEquals("Комплект одежды Soul Key", card.get().title());
        assertEquals("Soul Key", card.get().brand());
        assertEquals(2990, card.get().priceRub());
        assertEquals("https://ir.ozone.ru/s3/multimedia-1/test.webp", card.get().imageUrl());
        assertEquals(3, card.get().sizes().size());
    }

    @Test
    void parseHtmlGalleryState() {
        String html = """
                <div id="state-webGallery-123" data-state="{&quot;images&quot;:[{&quot;src&quot;:&quot;//ir.ozone.ru/s3/multimedia-1/html.webp&quot;}],\
                &quot;coverImage&quot;:&quot;//ir.ozone.ru/s3/multimedia-1/html.webp&quot;}"></div>
                <script type="application/ld+json">{"@type":"Product","name":"Платье","image":"https://ir.ozone.ru/s3/multimedia-1/ld.jpg","brand":{"name":"Brand"}}</script>
                """;

        Optional<OzonCatalog.OzonProductCard> card = OzonCatalog.parseHtmlPage(
                html,
                "plate-123456789",
                "https://www.ozon.ru/product/plate-123456789/"
        );

        assertTrue(card.isPresent());
        assertEquals("Платье", card.get().title());
        assertEquals("Brand", card.get().brand());
        assertEquals("https://ir.ozone.ru/s3/multimedia-1/html.webp", card.get().imageUrl());
    }

    @Test
    void detectImageMediaTypeFromBytes() {
        byte[] webp = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};
        assertEquals(MediaType.parseMediaType("image/webp"), OzonCatalog.detectImageMediaType(webp));
    }

    @Test
    void proxyImagePathUsesSlug() {
        assertEquals(
                "/api/v1/marketplaces/ozon/komplekt-odezhdy-soul-key-2154046881/image",
                OzonAdapter.proxyImagePath("komplekt-odezhdy-soul-key-2154046881")
        );
    }
}
