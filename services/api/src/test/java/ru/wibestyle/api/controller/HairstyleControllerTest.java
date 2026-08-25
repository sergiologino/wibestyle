package ru.wibestyle.api.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.service.HairstyleTryOnService;
import ru.wibestyle.api.storage.BlobStorage;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HairstyleControllerTest {
    @TempDir
    Path tempDir;

    @Test
    void imageUsesDatabasePathFromStorage() throws Exception {
        BlobStorage storage = mock(BlobStorage.class);
        HairstyleCatalogRepository catalog = mock(HairstyleCatalogRepository.class);
        Path image = tempDir.resolve("bixie.webp");
        Files.write(image, new byte[]{1, 2, 3});
        HairstyleCatalogEntity style = new HairstyleCatalogEntity(
                UUID.randomUUID(),
                "bixie",
                "Бикси",
                "Мягкий компромисс между пикси и бобом",
                "short",
                "Мягкие удлинённые виски, читаемый внешний контур.",
                "a soft bixie haircut with an open nape and elongated temple pieces",
                "catalog/hairstyles/bixie.webp",
                4,
                Instant.now()
        );
        when(catalog.findBySlug("bixie")).thenReturn(Optional.of(style));
        when(storage.exists("catalog/hairstyles/bixie.webp")).thenReturn(true);
        when(storage.resolveLocalFile("catalog/hairstyles/bixie.webp")).thenReturn(image);

        var response = new HairstyleController(mock(HairstyleTryOnService.class), storage, catalog).image("bixie");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/webp");
    }
}
