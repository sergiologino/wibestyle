package ru.wibestyle.api.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;

import java.time.Instant;
import java.util.UUID;

@Component
public class HairstyleCatalogSeeder {
    private final HairstyleCatalogRepository repo;

    public HairstyleCatalogSeeder(HairstyleCatalogRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    void seed() {
        Instant now = Instant.now();
        StyleSeed[] styles = {
                s("smooth-bob", "Гладкий боб", "short", "Плотный контур с мягко закруглёнными концами", "Плотный боб без заметных слоёв, концы слегка внутрь.", "a sleek chin-length bob with softly rounded inward ends", "smooth-bob.webp"),
                s("a-bob", "А-боб", "short", "Мягкое удлинение к лицу и объём на затылке", "Небольшая разница длины без резкой ножки.", "a refined A-line bob, subtly shorter at the nape and longer around the face", "a-bob.webp"),
                s("soft-pixie", "Пикси с мягкими перьями", "short", "Подвижная макушка и лёгкая челка", "Длина сверху и мягкая челка, без редких рваных прядей.", "a soft modern pixie cut with textured feathered crown and gentle fringe", "soft-pixie.webp"),
                s("pixie-diagonal", "Пикси с диагональной чёлкой", "short", "Удлинённая чёлка и подъём у корней", "Цельные пряди и диагональная чёлка без сильной филировки.", "a short pixie with an elongated diagonal side fringe and natural crown volume", "pixie-diagonal.webp"),
                s("bixie", "Бикси", "short", "Мягкий компромисс между пикси и бобом", "Мягкие удлинённые виски, читаемый внешний контур.", "a soft bixie haircut with an open nape and elongated temple pieces", "bixie.webp"),
                s("pixie-bob", "Пикси-боб", "short", "Округлый затылок и длиннее у лица", "Деликатная градуировка, без эффекта шапочки.", "a rounded pixie-bob with a softly graduated nape and longer face-framing pieces", "pixie-bob.webp"),
                s("french-bob", "Французский боб", "short", "Компактный боб с разделённой чёлкой", "Плотный срез и лёгкая чёлка.", "a French bob at jaw length with a light parted fringe", "french-bob.webp"),
                s("micro-bob", "Микро-боб", "short", "Короткая чистая линия у челюсти", "Чёткий, но не жёсткий контур у линии челюсти.", "a polished micro bob with a clean jaw-length contour", "micro-bob.jpg"),
                s("slip-lob", "Slip lob", "medium", "До ключиц, скрытые слои и лёгкий разворот концов", "Чистый контур и несколько невидимых слоёв.", "a collarbone-length slip lob with subtle invisible layers and softly flipped ends", "slip-lob.webp"),
                s("italian-bob", "Итальянский боб", "medium", "Мягкий округлый силуэт до основания шеи", "Сильный нижний контур и длинные скрытые слои.", "an Italian bob at the base of the neck with a softly rounded full contour", "italian-bob.webp"),
                s("asym-bob", "Асимметричный боб", "medium", "Деликатная асимметрия и боковой пробор", "Разница длины 1–2 см.", "a subtle asymmetric bob with a deep side part", "asym-bob.webp"),
                s("blunt-lob", "Лоб с плотным срезом", "medium", "Длина до ключиц и ровный край", "Ровный плотный срез без филировки.", "a blunt collarbone-length lob with a dense clean baseline", "blunt-lob.webp"),
                s("hidden-layers", "Лоб со скрытыми слоями", "medium", "Движение внутри формы без явного каскада", "Длинные внутренние слои, внешний край плотный.", "a medium-length lob with subtle hidden internal layers", "hidden-layers.webp"),
                s("long-layers-curtain", "Длинные слои и чёлка-шторка", "long", "Движение у лица без потери основной длины", "Плотный нижний край, длинные слои у лица и чёлка от центра.", "long layered hair with a soft curtain fringe and face-framing movement", "long-layers-curtain.webp"),
                s("u-cut", "Длинный U-срез", "long", "Плотный мягкий контур для длинных волос", "Максимальную длину сохранить, концы мягко закруглить.", "long straight hair with a dense U-shaped cut and softly rounded ends", "u-cut.webp"),
                s("soft-wolf", "Мягкий wolf cut", "long", "Подвижная макушка и сохранённая плотность", "Сохранить плотность снизу, сделать мягкие слои.", "a soft wearable wolf cut with connected layers and dense ends", "soft-wolf.webp"),
                s("long-curtain", "Длинная чёлка-шторка", "long", "Удлинённая чёлка, соединённая с длиной", "Удлинённые края, которые можно убрать за уши.", "long hair with an elongated soft curtain fringe blended into face-framing layers", "long-curtain.jpg"),
                s("butterfly", "Стрижка Бабочка", "long", "Воздушные уровни у лица", "Слои начать от лица, длину сохранить.", "a long butterfly haircut with airy face-framing layers", "butterfly.jpg"),
                s("glass-hair", "Стеклянные волосы", "styling", "Гладкая укладка с зеркальным блеском", "Гладкий финиш и чистый пробор.", "ultra sleek glass hair, straight glossy lengths and a clean precise part", "glass-hair.jpg"),
                s("sleek-ponytail", "Гладкий хвост", "styling", "Минималистичная укладка с чистым контуром", "Гладко собрать у лица.", "a sleek low ponytail with a clean polished contour", "sleek-ponytail.jpg"),
        };

        for (int i = 0; i < styles.length; i += 1) {
            StyleSeed style = styles[i];
            if (repo.findBySlug(style.slug()).isPresent()) {
                continue;
            }
            repo.save(new HairstyleCatalogEntity(
                    UUID.randomUUID(),
                    style.slug(),
                    style.title(),
                    style.description(),
                    style.type(),
                    style.masterNote(),
                    style.aiDirective(),
                    "catalog/hairstyles/" + style.fileName(),
                    i,
                    now
            ));
        }
    }

    private static StyleSeed s(String slug, String title, String type, String description,
                               String masterNote, String aiDirective, String fileName) {
        return new StyleSeed(slug, title, type, description, masterNote, aiDirective, fileName);
    }

    private record StyleSeed(String slug, String title, String type, String description,
                             String masterNote, String aiDirective, String fileName) {
    }
}
