package ru.wibestyle.api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminCatalogControllerTest {
    @Test
    @SuppressWarnings("unchecked")
    void hairstyleAdminListIncludesImageUrls() {
        HairstyleCatalogRepository repo = mock(HairstyleCatalogRepository.class);
        when(repo.findAllByOrderBySortOrderAsc()).thenReturn(List.of(hairstyle()));

        var response = new AdminHairstyleController(repo, mock(BlobStorage.class), admin()).list("dev-admin-key");
        var items = (List<Map<String, Object>>) response.get("items");

        assertThat(items).hasSize(1);
        assertThat(items.get(0).get("imageUrl").toString()).startsWith("/api/v1/hairstyles/bixie/image?v=");
        assertThat(items.get(0).get("adminImageUrl").toString()).startsWith("/api/v1/admin/hairstyles/bixie/image?v=");
    }

    @Test
    void hairstyleImageUploadWritesToStorageAndUpdatesPath() throws Exception {
        HairstyleCatalogEntity entity = hairstyle();
        HairstyleCatalogRepository repo = mock(HairstyleCatalogRepository.class);
        BlobStorage storage = mock(BlobStorage.class);
        when(repo.findBySlug("bixie")).thenReturn(Optional.of(entity));
        var image = new MockMultipartFile("image", "bixie.png", "image/png", new byte[]{1, 2, 3});

        new AdminHairstyleController(repo, storage, admin()).image("dev-admin-key", "bixie", image);

        verify(storage).put(eq("catalog/hairstyles/bixie.png"), any());
        assertThat(entity.getImagePath()).isEqualTo("catalog/hairstyles/bixie.png");
        verify(repo).save(entity);
    }

    @Test
    @SuppressWarnings("unchecked")
    void hairColorAdminUpdateEditsCatalogFields() {
        HairColorCatalogEntity entity = hairColor();
        HairColorCatalogRepository repo = mock(HairColorCatalogRepository.class);
        when(repo.findBySlug("red-coral")).thenReturn(Optional.of(entity));

        var response = new AdminHairColorController(repo, mock(BlobStorage.class), admin()).update(
                "dev-admin-key",
                "red-coral",
                Map.of(
                        "title", "Красный коралл",
                        "family", "Красные",
                        "description", "Яркий красный оттенок",
                        "aiDirective", "change only hair color to red coral",
                        "sourceBrand", "Garnier",
                        "sourceUrl", "https://www.garnier.ru/example",
                        "attributionText", "Правообладатель: Garnier",
                        "sortOrder", "12",
                        "active", "false"
                )
        );

        var item = (Map<String, Object>) response.get("item");
        assertThat(item).containsEntry("title", "Красный коралл");
        assertThat(item.get("adminImageUrl").toString()).startsWith("/api/v1/admin/hair-colors/red-coral/image?v=");
        assertThat(entity.isActive()).isFalse();
        verify(repo).save(entity);
    }

    private static AdminProperties admin() {
        return new AdminProperties();
    }

    private static HairstyleCatalogEntity hairstyle() {
        return new HairstyleCatalogEntity(
                UUID.randomUUID(),
                "bixie",
                "Бикси",
                "Короткая форма",
                "short",
                "Подойдет для овала",
                "apply bixie haircut",
                "catalog/hairstyles/bixie.jpg",
                1,
                Instant.now()
        );
    }

    private static HairColorCatalogEntity hairColor() {
        return new HairColorCatalogEntity(
                UUID.randomUUID(),
                "red-coral",
                "6.60 Красный коралл",
                "Красные",
                "Оттенок Garnier Color Sensation.",
                "change only hair color to red coral",
                "catalog/hair-colors/red-coral.jpg",
                "Garnier",
                "https://www.garnier.ru/hair-color/beauty/garnier/color-sensation/6-60-krasnyj-korall",
                "Фото оттенков взяты из публичного каталога Garnier. Правообладатель: Garnier.",
                12,
                Instant.now()
        );
    }
}
