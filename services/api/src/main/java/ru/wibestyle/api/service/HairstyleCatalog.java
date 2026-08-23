package ru.wibestyle.api.service;

import java.util.List;

/** Small editorial catalogue: intentionally curated rather than an overwhelming marketplace-style grid. */
public final class HairstyleCatalog {
    private HairstyleCatalog() {}
    public record Style(String id, String title, String fileName, String prompt) {}
    public static final List<Style> STYLES = List.of(
            s("smooth-bob", "Гладкий боб", "smooth-bob.webp", "a sleek chin-length bob with softly rounded inward ends"),
            s("a-bob", "А-боб", "a-bob.webp", "a refined A-line bob, subtly shorter at the nape and longer around the face"),
            s("soft-pixie", "Пикси с мягкими перьями", "soft-pixie.webp", "a soft modern pixie cut with textured feathered crown and gentle fringe"),
            s("pixie-diagonal", "Пикси с диагональной чёлкой", "pixie-diagonal.webp", "a short pixie with an elongated diagonal side fringe and natural crown volume"),
            s("bixie", "Бикси", "bixie.webp", "a soft bixie haircut with an open nape and elongated temple pieces"),
            s("pixie-bob", "Пикси-боб", "pixie-bob.webp", "a rounded pixie-bob with a softly graduated nape and longer face-framing pieces"),
            s("french-bob", "Французский боб", "french-bob.webp", "a French bob at jaw length with a light parted fringe"),
            s("micro-bob", "Микро-боб", "micro-bob.jpg", "a polished micro bob with a clean jaw-length contour"),
            s("slip-lob", "Slip lob", "slip-lob.webp", "a collarbone-length slip lob with subtle invisible layers and softly flipped ends"),
            s("italian-bob", "Итальянский боб", "italian-bob.webp", "an Italian bob at the base of the neck with a softly rounded full contour"),
            s("asym-bob", "Асимметричный боб", "asym-bob.webp", "a subtle asymmetric bob with a deep side part"),
            s("blunt-lob", "Лоб с плотным срезом", "blunt-lob.webp", "a blunt collarbone-length lob with a dense clean baseline"),
            s("hidden-layers", "Лоб со скрытыми слоями", "hidden-layers.webp", "a medium-length lob with subtle hidden internal layers"),
            s("long-layers-curtain", "Длинные слои и чёлка-шторка", "long-layers-curtain.webp", "long layered hair with a soft curtain fringe and face-framing movement"),
            s("u-cut", "Длинный U-срез", "u-cut.webp", "long straight hair with a dense U-shaped cut and softly rounded ends"),
            s("soft-wolf", "Мягкий wolf cut", "soft-wolf.webp", "a soft wearable wolf cut with connected layers and dense ends"),
            s("long-curtain", "Длинная чёлка-шторка", "long-curtain.jpg", "long hair with an elongated soft curtain fringe blended into layers"),
            s("butterfly", "Стрижка Бабочка", "butterfly.jpg", "a long butterfly haircut with airy face-framing layers"),
            s("glass-hair", "Стеклянные волосы", "glass-hair.jpg", "ultra sleek glass hair, straight glossy lengths and a clean precise part"),
            s("sleek-ponytail", "Гладкий хвост", "sleek-ponytail.jpg", "a sleek low ponytail with a clean polished contour and natural hairline")
    );
    private static Style s(String id, String title, String file, String prompt) { return new Style(id, title, file, prompt); }
    public static Style require(String id) { return STYLES.stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND")); }
}
