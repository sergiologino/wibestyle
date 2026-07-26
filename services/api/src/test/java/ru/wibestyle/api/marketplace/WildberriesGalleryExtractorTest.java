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
    void usesFollowingImageWhenFirstMediaIsVideoJs() {
        String html = """
                <video-js class="vjs-big-play-centered">
                  <video src="https://videonme-basket-04.wbcontent.net/vol45/part74571/745716141/mp4/360p/1.mp4"></video>
                </video-js>
                <img data-src-pb="https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/c246x328/1.webp"
                     src="https://basket-35.wbcontent.net/vol7457/part745716/745716141/images/c246x328/1.webp">
                <img data-src-pb="https://basket-40.wbbasket.ru/vol9434/part943456/943456648/images/c246x328/1.webp"
                     src="https://basket-40.wbcontent.net/vol9434/part943456/943456648/images/c246x328/1.webp">
                """;

        List<String> photos = WildberriesGalleryExtractor.extractPhotoUrls(html, 745716141L);

        assertEquals(1, photos.size());
        assertEquals("https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/big/1.webp", photos.get(0));
    }

    @Test
    void extractsBasketHostFromPhotoUrl() {
        assertEquals(
                "https://basket-35.wbbasket.ru",
                WildberriesGalleryExtractor.extractBasketHost(
                        "https://basket-35.wbcontent.net/vol7457/part745716/745716141/images/c246x328/1.webp"));
    }

    @Test
    void extractsCurrentWildberriesMiniatureAndLargeImageMarkup() {
        String html = """
                <div class="swiper-slide miniatureSlide--acvJc activeBorder--lsOTy swiper-slide-active" style="margin-bottom: 12px;">
                  <img data-src-pb="https://basket-41.wbbasket.ru/vol10214/part1021495/1021495555/images/c246x328/1.webp"
                       alt="Product image 1" width="84" height="112" class=""
                       src="https://basket-41.wbcontent.net/vol10214/part1021495/1021495555/images/c246x328/1.webp">
                </div>
                <div class="imgContainer--N9WXW">
                  <img alt="Product image 1" loading="eager" fetchpriority="high" width="900" height="1200"
                       src="https://basket-41.wbcontent.net/vol10214/part1021495/1021495555/images/big/1.webp"
                       style="opacity: 1;">
                </div>
                """;

        List<String> photos = WildberriesGalleryExtractor.extractPhotoUrls(html, 1021495555L);

        assertEquals(1, photos.size());
        assertEquals(
                "https://basket-41.wbbasket.ru/vol10214/part1021495/1021495555/images/big/1.webp",
                photos.get(0)
        );
    }

    @Test
    void extractsCurrentWildberriesMarkupFromOlderShard() {
        String html = """
                <div class="swiper-slide miniatureSlide--acvJc activeBorder--lsOTy swiper-slide-active" style="margin-bottom: 12px;">
                  <img data-src-pb="https://basket-10.wbbasket.ru/vol1532/part153241/153241989/images/c246x328/1.webp"
                       alt="Product image 1" width="84" height="112" class=""
                       src="https://basket-10.wbcontent.net/vol1532/part153241/153241989/images/c246x328/1.webp">
                </div>
                <div class="imgContainer--N9WXW">
                  <img alt="Product image 1" loading="eager" fetchpriority="high" width="900" height="1200"
                       src="https://basket-10.wbcontent.net/vol1532/part153241/153241989/images/big/1.webp"
                       style="opacity: 1;">
                </div>
                """;

        List<String> photos = WildberriesGalleryExtractor.extractPhotoUrls(html, 153241989L);

        assertEquals(1, photos.size());
        assertEquals(
                "https://basket-10.wbbasket.ru/vol1532/part153241/153241989/images/big/1.webp",
                photos.get(0)
        );
    }
}
