package ru.wibestyle.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAiProviderErrorsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsSeededContentModerationMapping() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ai-provider-errors")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].errorText")
                        .value("Generated image rejected by content moderation."))
                .andExpect(jsonPath("$.items[0].description")
                        .value(org.hamcrest.Matchers.containsString("не списана с вашего баланса")));
    }

    @Test
    @Transactional
    void createsProviderErrorMapping() throws Exception {
        mockMvc.perform(post("/api/v1/admin/ai-provider-errors")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "errorText":"New provider safety rejection",
                                  "description":"Нейросеть отклонила запрос. Примерка не списана.",
                                  "enabled":true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.errorText").value("New provider safety rejection"))
                .andExpect(jsonPath("$.enabled").value(true));
    }
}
