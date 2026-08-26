package ru.wibestyle.api.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;

import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class HairColorCatalogSeeder {
    private static final String ATTRIBUTION = "Фото оттенков взяты из публичного каталога Garnier. Правообладатель: Garnier.";
    private final HairColorCatalogRepository repo;

    public HairColorCatalogSeeder(HairColorCatalogRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    void seed() {
        Instant now = Instant.now();
        ColorSeed[] colors = {
                c("6-2-crystal-pink-blond", "6.2 Кристально розовый блонд", "Блонд", 0),
                c("6-0-precious-dark-blonde", "6.0 Роскошный темно-русый", "Русые", 1),
                c("6-12-prismatic-dark-blond", "6.12 Сверкающий холодный мокко", "Каштановые", 2),
                c("7-0-delicate-opal-blond", "7.0 Изысканный золотистый топаз", "Русые", 3),
                c("7-12-silver-pearly-blond", "7.12 Жемчужно-пепельный блонд", "Блонд", 4),
                c("8-0-luminous-light-blonde", "8.0 Переливающийся светло-русый", "Русые", 5),
                c("9-13-cristal-beige-blond", "9.13 Кремовый перламутр", "Блонд", 6),
                c("10-21-delicate-pearly-blond", "10.21 Перламутровый шелк", "Блонд", 7),
                c("111-silver-ultra-blond", "111 Ультраблонд платиновый", "Блонд", 8),
                c("110-diamond-ultra-blond", "110 Ультраблонд чистый бриллиант", "Блонд", 9),
                c("101-product-2-blond", "101 Серебристый блонд", "Блонд", 10),
                c("5-62-intense-precious-garnet", "5.62 Царский гранат", "Красные", 11),
                c("6-60-krasnyj-korall", "6.60 Красный коралл", "Красные", 12),
                c("5-0-siyayushchij-svetlo-kashtanovyj", "5.0 Сияющий светло-каштановый", "Каштановые", 13),
                c("4-0-korolevskij-oniks", "4.0 Королевский оникс", "Каштановые", 14),
                c("3-11-ash-black", "3.11 Пепельный черный", "Черные", 15),
                c("2-2-pearl-black", "2.2 Перламутровый черный", "Черные", 16),
                c("8-12-rozoviy-perlamutr", "8.12 Розовый перламутр", "Блонд", 17),
                c("3-16-ametist", "3.16 Аметист", "Акцентные", 18),
                c("911-smoky-ultrablond", "911 Дымчатый Ультраблонд", "Блонд", 19),
                c("9-02-perlamutroviy-blond", "9.02 Перламутровый блонд", "Блонд", 20),
                c("7_40_amber_bright_red", "7.40 Янтарный Ярко-Рыжий", "Рыжие", 21),
                c("5-51-rubin-marsela", "5.51 Рубиновая Марсала", "Красные", 22),
                c("5-35-cinnamon-brown", "5.35 Пряный шоколад", "Каштановые", 23),
                c("4-15-icy-chestnut", "4.15 Благородный рубин", "Красные", 24),
                c("3-0-prestige-brown", "3.0 Роскошный каштан", "Каштановые", 25),
                c("1-0-ultra-onyx-black", "1.0 Драгоценный черный агат", "Черные", 26),
        };
        var activeSlugs = Arrays.stream(colors).map(ColorSeed::slug).collect(Collectors.toSet());

        for (ColorSeed color : colors) {
            var existing = repo.findBySlug(color.slug());
            if (existing.isPresent()) {
                HairColorCatalogEntity entity = existing.get();
                entity.updateCatalogData(
                        color.title(),
                        color.family(),
                        color.description(),
                        color.aiDirective(),
                        color.imagePath(),
                        "Garnier",
                        color.sourceUrl(),
                        ATTRIBUTION,
                        color.sortOrder(),
                        now
                );
                repo.save(entity);
                continue;
            }
            repo.save(new HairColorCatalogEntity(
                    UUID.randomUUID(),
                    color.slug(),
                    color.title(),
                    color.family(),
                    color.description(),
                    color.aiDirective(),
                    color.imagePath(),
                    "Garnier",
                    color.sourceUrl(),
                    ATTRIBUTION,
                    color.sortOrder(),
                    now
            ));
        }

        repo.findAll().stream()
                .filter(color -> "Garnier".equalsIgnoreCase(color.getSourceBrand()))
                .filter(color -> !activeSlugs.contains(color.getSlug()) && color.isActive())
                .forEach(color -> {
                    color.deactivate(now);
                    repo.save(color);
                });
    }

    private static ColorSeed c(String slug, String title, String family, int sortOrder) {
        return new ColorSeed(
                slug,
                title,
                family,
                "Оттенок Garnier Color Sensation " + title + ".",
                "change only hair color to Garnier Color Sensation shade " + title
                        + ", preserving the selected haircut shape, hair length, hair texture, face, skin, clothes, background, and all non-hair details",
                "catalog/hair-colors/" + slug + ".jpg",
                "https://www.garnier.ru/hair-color/beauty/garnier/color-sensation/" + slug,
                sortOrder
        );
    }

    private record ColorSeed(String slug, String title, String family, String description,
                             String aiDirective, String imagePath, String sourceUrl, int sortOrder) {
    }
}
