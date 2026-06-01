package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class WildberriesMediaUtilsTest {

    private static final byte[] WEBP_PREFIX = {
            'R', 'I', 'F', 'F', 0x00, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P'
    };

    private static final byte[] MP4_PREFIX = {
            0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'm', 'p', '4', '2'
    };

    @Test
    void detectsVideoUrlsFromWildberriesCdn() {
        assertTrue(WildberriesMediaUtils.isVideoMediaUrl(
                "https://videonme-basket-04.wbcontent.net/vol45/part74571/745716141/mp4/360p/1.mp4"));
        assertTrue(WildberriesMediaUtils.isVideoMediaUrl(
                "https://videonme-basket-07.wbcontent.net/vol75/part74571/745717899/mp4/360p/1.mp4"));
        assertTrue(WildberriesMediaUtils.isVideoMediaUrl("https://video.wbstatic.net/video/new/123/456.mp4"));
        assertFalse(WildberriesMediaUtils.isVideoMediaUrl(
                "https://basket-35.wbbasket.ru/vol7457/part745716/745716141/images/c246x328/1.webp"));
        assertFalse(WildberriesMediaUtils.isVideoMediaUrl(
                "https://basket-14.wbbasket.ru/vol2082/part208285/208285191/images/big/1.webp"));
    }

    @Test
    void acceptsWebpAndRejectsMp4Bytes() {
        assertTrue(WildberriesMediaUtils.isProductImageBytes(WEBP_PREFIX));
        assertFalse(WildberriesMediaUtils.isProductImageBytes(MP4_PREFIX));
        assertTrue(WildberriesMediaUtils.isVideoBytes(MP4_PREFIX));
    }
}
