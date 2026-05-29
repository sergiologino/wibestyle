package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.marketplace.OzonAdapter;
import ru.wibestyle.api.marketplace.WildberriesAdapter;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GarmentImageService {

    private static final Pattern WILDBERRIES_PROXY =
            Pattern.compile("^/api/v1/marketplaces/wildberries/(\\d+)/image$");
    private static final Pattern OZON_PROXY =
            Pattern.compile("^/api/v1/marketplaces/ozon/([^/]+)/image$");

    private final BlobStorage blobStorage;
    private final WildberriesAdapter wildberriesAdapter;
    private final OzonAdapter ozonAdapter;
    private final RestClient restClient;

    public GarmentImageService(
            BlobStorage blobStorage,
            WildberriesAdapter wildberriesAdapter,
            OzonAdapter ozonAdapter,
            RestClient.Builder restClientBuilder
    ) {
        this.blobStorage = blobStorage;
        this.wildberriesAdapter = wildberriesAdapter;
        this.ozonAdapter = ozonAdapter;
        this.restClient = restClientBuilder.build();
    }

    /**
     * Downloads remote garment image into session storage for AI processing.
     */
    public void ensureLocalGarmentPhoto(UUID userId, TryOnSessionEntity session) throws IOException {
        if (session.getGarmentPhotoPath() != null && blobStorage.exists(session.getGarmentPhotoPath())) {
            return;
        }
        String imageUrl = session.getProductImageUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        if (imageUrl.startsWith("/api/v1/try-on/sessions/")) {
            return;
        }

        byte[] bytes = loadRemoteImageBytes(imageUrl);
        if (bytes == null || bytes.length == 0) {
            throw new IOException("Empty garment image response");
        }
        String extension = imageUrl.toLowerCase().contains(".png") ? ".png" : ".webp";
        String storedPath = blobStorage.storeGarmentPhoto(
                userId,
                session.getId(),
                extension,
                new ByteArrayInputStream(bytes)
        );
        session.setGarmentPhotoPath(storedPath);
        session.setProductImageUrl("/api/v1/try-on/sessions/" + session.getId() + "/garment-photo");
    }

    byte[] loadRemoteImageBytes(String imageUrl) throws IOException {
        Matcher wbMatcher = WILDBERRIES_PROXY.matcher(imageUrl);
        if (wbMatcher.matches()) {
            return wildberriesAdapter.loadProductImage(wbMatcher.group(1));
        }
        Matcher ozonMatcher = OZON_PROXY.matcher(imageUrl);
        if (ozonMatcher.matches()) {
            return ozonAdapter.loadProductImage(ozonMatcher.group(1), null);
        }
        if (imageUrl.startsWith("/assets/")) {
            return null;
        }
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return restClient.get()
                    .uri(URI.create(imageUrl))
                    .retrieve()
                    .body(byte[].class);
        }
        throw new IOException("Unsupported garment image url: " + imageUrl);
    }
}
