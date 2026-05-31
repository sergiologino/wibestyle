package ru.wibestyle.api.ai;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FaceLockPromptBuilderTest {

    @Test
    void emphasizesAvatarFaceOverMarketplaceModel() {
        String faceLock = FaceLockPromptBuilder.build();

        assertThat(faceLock).contains("image1");
        assertThat(faceLock).contains("image2");
        assertThat(faceLock).contains("игнорируй");
        assertThat(faceLock).contains("ЗАПРЕЩЕНО");
        assertThat(faceLock).contains("лицо");
    }
}
