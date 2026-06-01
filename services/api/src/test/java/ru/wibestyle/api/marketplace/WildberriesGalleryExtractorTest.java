package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class WildberriesGalleryExtractorTest {

    private static final String SAMPLE_MINIATURES = """
            <div class="swiper-wrapper miniaturesWrapper--Yw0YN">
            <video-js class="vjs-big-play-centered">
            <video src="https://videonme-basket-04.wbcontent.net/vol45/part74571/745716141/mp4/360p/1.mp4"></video>
            </video-js>
            <img data-src-pb="https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/c246x328/1.webp"
                 src="https://basket-35.wbcontent.net/vol7457/part745716/745716141/images/c246x328/1.webp" alt="Product image 1">
            <img src="https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/c246x328/2.webp" alt="Product image 2">
            </div>
            """;

    @Test
    void extractsPhotosInOrderAndSkipsVideoSlot() {
        List<String> photos = WildberriesGalleryExtractor.extractPhotoUrls(SAMPLE_MINIATURES, 745716141L);
        assertEquals(2, photos.size());
        assertTrue(photos.get(0).contains("/images/big/1.webp"));
        assertTrue(photos.get(0).contains("basket-35.wbbasket.ru"));
        assertFalse(photos.get(0).contains("videonme"));
        assertTrue(photos.get(1).contains("/images/big/2.webp"));
    }

    @Test
    void extractsBasketHostFromPhotoUrl() {
        assertEquals(
                "https://basket-35.wbbasket.ru",
                WildberriesGalleryExtractor.extractBasketHost(
                        "https://basket-35.wbcontent.net/vol7457/part745716/745716141/images/c246x328/1.webp"));
    }
}
