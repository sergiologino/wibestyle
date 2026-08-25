package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HairstyleCatalogSeederTest {
    @Test
    void backfillsMobileStylesWhenCatalogAlreadyExists() {
        HairstyleCatalogRepository repo = mock(HairstyleCatalogRepository.class);
        HairstyleCatalogEntity existing = mock(HairstyleCatalogEntity.class);
        when(repo.findBySlug("bixie")).thenReturn(Optional.empty());
        when(repo.findBySlug("pixie-bob")).thenReturn(Optional.empty());
        when(repo.findBySlug("micro-bob")).thenReturn(Optional.empty());
        when(repo.findBySlug("long-curtain")).thenReturn(Optional.empty());
        when(repo.findBySlug("pixie-diagonal")).thenReturn(Optional.empty());
        when(repo.findBySlug(argThat(slug ->
                !"bixie".equals(slug)
                        && !"pixie-bob".equals(slug)
                        && !"micro-bob".equals(slug)
                        && !"long-curtain".equals(slug)
                        && !"pixie-diagonal".equals(slug)
        ))).thenReturn(Optional.of(existing));

        new HairstyleCatalogSeeder(repo).seed();

        ArgumentCaptor<HairstyleCatalogEntity> captor = ArgumentCaptor.forClass(HairstyleCatalogEntity.class);
        verify(repo, times(5)).save(captor.capture());
        List<HairstyleCatalogEntity> saved = captor.getAllValues();
        assertThat(saved)
                .extracting(HairstyleCatalogEntity::getSlug)
                .containsExactlyInAnyOrder("bixie", "pixie-bob", "micro-bob", "long-curtain", "pixie-diagonal");
        assertThat(saved)
                .extracting(HairstyleCatalogEntity::getImagePath)
                .containsExactlyInAnyOrder(
                        "catalog/hairstyles/bixie.webp",
                        "catalog/hairstyles/pixie-bob.webp",
                        "catalog/hairstyles/micro-bob.jpg",
                        "catalog/hairstyles/long-curtain.jpg",
                        "catalog/hairstyles/pixie-diagonal.webp"
                );
    }
}
