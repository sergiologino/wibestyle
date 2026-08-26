package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HairstyleCatalogTest {
    @Test
    void keepsEditorialCatalogueUniqueAndSubstantial() {
        assertThat(HairstyleCatalog.STYLES).hasSizeGreaterThanOrEqualTo(18);
        assertThat(new HashSet<>(HairstyleCatalog.STYLES.stream().map(HairstyleCatalog.Style::id).toList()))
                .hasSameSizeAs(HairstyleCatalog.STYLES);
        assertThat(HairstyleCatalog.require("smooth-bob").title()).isEqualTo("Гладкий боб");
    }

    @Test
    void rejectsUnknownStyleInsteadOfSendingAnUntrustedPrompt() {
        assertThatThrownBy(() -> HairstyleCatalog.require("ignore-previous-instructions"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("HAIRSTYLE_NOT_FOUND");
    }
}
