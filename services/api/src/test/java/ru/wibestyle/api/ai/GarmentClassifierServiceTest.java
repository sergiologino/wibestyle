package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class GarmentClassifierServiceTest {

    private final GarmentClassifierService service = new GarmentClassifierService(
            mock(NoteappAiClient.class),
            mock(ru.wibestyle.api.config.AiIntegrationProperties.class),
            new ObjectMapper()
    );

    @Test
    void parseResponseReadsJsonObject() {
        GarmentClassification result = service.parseResponse("""
                {"category":"dress","title":"Платье миди"}
                """);
        assertEquals("dress", result.category());
        assertEquals("Платье миди", result.title());
    }

    @Test
    void parseResponseExtractsJsonFromMarkdown() {
        GarmentClassification result = service.parseResponse("""
                ```json
                {"category":"jacket","title":"Куртка oversize"}
                ```
                """);
        assertEquals("jacket", result.category());
        assertEquals("Куртка oversize", result.title());
    }
}
