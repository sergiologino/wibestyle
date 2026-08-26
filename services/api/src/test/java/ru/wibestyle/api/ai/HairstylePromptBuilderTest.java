package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.service.HairstyleCatalog;
import static org.assertj.core.api.Assertions.assertThat;

class HairstylePromptBuilderTest {
    @Test
    void locksIdentityAndLimitsEditsToHair() {
        String prompt = new HairstylePromptBuilder().build(HairstyleCatalog.require("smooth-bob"));
        assertThat(prompt).contains("sole identity source", "IDENTITY LOCK", "modify only hair pixels", "never copy its face");
        assertThat(prompt).contains("sleek chin-length bob");
        assertThat(prompt).doesNotContain("garment");
    }
}
