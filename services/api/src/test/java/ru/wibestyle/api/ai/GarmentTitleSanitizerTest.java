package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GarmentTitleSanitizerTest {

    @Test
    void replacesSexualAdjectiveDeclensions() {
        assertEquals("Стильное платье миди", GarmentTitleSanitizer.forPrompt("Сексуальное платье миди"));
        assertEquals("стильная блузка", GarmentTitleSanitizer.forPrompt("сексуальная блузка"));
        assertEquals("стильный топ", GarmentTitleSanitizer.forPrompt("сексуальный топ"));
        assertEquals("стильные брюки", GarmentTitleSanitizer.forPrompt("сексуальные брюки"));
    }

    @Test
    void replacesEroticOutfitPhrase() {
        assertEquals("повседневный наряд", GarmentTitleSanitizer.forPrompt("эротический наряд"));
        assertEquals("повседневная сорочка", GarmentTitleSanitizer.forPrompt("эротическая сорочка"));
        assertEquals("домашняя одежда ночная", GarmentTitleSanitizer.forPrompt("эротика ночная"));
    }

    @Test
    void replacesArousingAndEnglishTerms() {
        assertEquals("привлекательное белье", GarmentTitleSanitizer.forPrompt("возбуждающее белье"));
        assertEquals("stylish red dress", GarmentTitleSanitizer.forPrompt("sexy red dress"));
        assertEquals("homewear nightgown", GarmentTitleSanitizer.forPrompt("erotic nightgown"));
    }

    @Test
    void leavesNeutralTitlesUntouched() {
        assertEquals("Платье миди облегающее", GarmentTitleSanitizer.forPrompt("Платье миди облегающее"));
        assertEquals("Ночная сорочка хлопок", GarmentTitleSanitizer.forPrompt("Ночная сорочка хлопок"));
    }

    @Test
    void handlesNullAndBlank() {
        assertEquals(null, GarmentTitleSanitizer.forPrompt(null));
        assertEquals("  ", GarmentTitleSanitizer.forPrompt("  "));
    }
}
