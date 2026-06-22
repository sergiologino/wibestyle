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
                {"category":"dress","title":"Midi dress","promptProfile":"dress","coverageLevel":"normal","moderationRisk":"low","hasHumanModel":true}
                """);
        assertEquals("dress", result.category());
        assertEquals("Midi dress", result.title());
        assertEquals(true, result.hasHumanModel());
    }

    @Test
    void parseResponseExtractsJsonFromMarkdown() {
        GarmentClassification result = service.parseResponse("""
                ```json
                {"category":"jacket","title":"Oversize jacket"}
                ```
                """);
        assertEquals("jacket", result.category());
        assertEquals("Oversize jacket", result.title());
    }

    @Test
    void fallbackAssumesProductPhotoMayContainHumanModel() {
        GarmentClassification result = service.fallbackFromText(null, null);

        assertEquals("other", result.category());
        assertEquals(true, result.hasHumanModel());
    }

    @Test
    void unavailableVisionClassifierKeepsConservativeHumanModelFallback() {
        GarmentClassification fallback = service.fallbackFromText(null, null);

        GarmentClassification result = service.classifyBytes(new byte[]{1, 2, 3}, "image/jpeg", fallback);

        assertEquals("other", result.category());
        assertEquals(true, result.hasHumanModel());
    }
}
