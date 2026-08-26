package ru.wibestyle.api.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HairColorControllerTest {
    @TempDir
    Path tempDir;

    @Test
    void imageUsesDatabasePathFromStorage() throws Exception {
        BlobStorage storage = mock(BlobStorage.class);
        HairColorCatalogRepository colors = mock(HairColorCatalogRepository.class);
        Path image = tempDir.resolve("6-60-krasnyj-korall.jpg");
        Files.write(image, new byte[]{1, 2, 3});
        HairColorCatalogEntity color = new HairColorCatalogEntity(
                UUID.randomUUID(),
                "6-60-krasnyj-korall",
                "6.60 Красный коралл",
                "Красные",
                "Оттенок Garnier Color Sensation 6.60 Красный коралл.",
                "change only hair color to Garnier Color Sensation shade 6.60 Красный коралл",
                "catalog/hair-colors/6-60-krasnyj-korall.jpg",
                "Garnier",
                "https://www.garnier.ru/hair-color/beauty/garnier/color-sensation/6-60-krasnyj-korall",
                "Фото оттенков взяты из публичного каталога Garnier. Правообладатель: Garnier.",
                4,
                Instant.now()
        );
        when(colors.findBySlug("6-60-krasnyj-korall")).thenReturn(Optional.of(color));
        when(storage.exists("catalog/hair-colors/6-60-krasnyj-korall.jpg")).thenReturn(true);
        when(storage.resolveLocalFile("catalog/hair-colors/6-60-krasnyj-korall.jpg")).thenReturn(image);

        var response = new HairColorController(colors, storage).image("6-60-krasnyj-korall");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/jpeg");
        assertThat(response.getHeaders().getCacheControl()).contains("max-age=604800");
        assertThat(response.getHeaders().getCacheControl()).contains("public");
    }
}
