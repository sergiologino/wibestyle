package ru.wibestyle.api.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiIntegrationPropertiesTest {

    @Test
    void normalizesStylistGrokImagineAliasToNoteappNetworkName() {
        AiIntegrationProperties properties = new AiIntegrationProperties();

        properties.setStylistImageNetwork("grok-imagine");

        assertThat(properties.getStylistImageNetwork()).isEqualTo("wibestyle-vton");
    }
}
