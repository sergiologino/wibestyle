package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HairColorCatalogSeederTest {
    @Test
    void seedsGarnierTexturesIntoStorageBackedCatalog() {
        HairColorCatalogRepository repo = mock(HairColorCatalogRepository.class);
        when(repo.findBySlug(org.mockito.ArgumentMatchers.anyString())).thenReturn(Optional.empty());
        when(repo.findAll()).thenReturn(List.of());

        new HairColorCatalogSeeder(repo).seed();

        ArgumentCaptor<HairColorCatalogEntity> captor = ArgumentCaptor.forClass(HairColorCatalogEntity.class);
        verify(repo, times(27)).save(captor.capture());
        List<HairColorCatalogEntity> saved = captor.getAllValues();
        assertThat(saved).extracting(HairColorCatalogEntity::getImagePath).allMatch(path -> path.startsWith("catalog/hair-colors/"));
        assertThat(saved).extracting(HairColorCatalogEntity::getImagePath).allMatch(path -> path.endsWith(".jpg"));
        assertThat(saved).extracting(HairColorCatalogEntity::getSourceBrand).containsOnly("Garnier");
        assertThat(saved).extracting(HairColorCatalogEntity::getAttributionText).allMatch(text -> text.contains("Правообладатель: Garnier"));
        assertThat(saved).extracting(HairColorCatalogEntity::getSlug).contains("6-60-krasnyj-korall");
    }
}
