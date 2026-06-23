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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAiProvidersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsGrokFashnAndKlingPhotoRoutes() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ai-providers")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.VIRTUAL_TRY_ON_PHOTO.length()").value(3))
                .andExpect(jsonPath("$.VIRTUAL_TRY_ON_PHOTO[0].networkName").value("wibestyle-vton"))
                .andExpect(jsonPath("$.VIRTUAL_TRY_ON_PHOTO[1].networkName").value("fashn-try-on-photo"))
                .andExpect(jsonPath("$.VIRTUAL_TRY_ON_PHOTO[2].networkName").value("kling-try-on-photo"));
    }

    @Test
    @Transactional
    void updatesProviderOrderAndEnabledState() throws Exception {
        mockMvc.perform(put("/api/v1/admin/ai-providers/VIRTUAL_TRY_ON_PHOTO")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"items":[
                                  {"networkName":"wibestyle-vton","displayName":"Grok Imagine","priorityOrder":20,"enabled":true},
                                  {"networkName":"fashn-try-on-photo","displayName":"FASHN Try-On Photo","priorityOrder":10,"enabled":true},
                                  {"networkName":"kling-try-on-photo","displayName":"Kling Virtual Try-On","priorityOrder":30,"enabled":false}
                                ]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].networkName").value("fashn-try-on-photo"))
                .andExpect(jsonPath("$.items[2].enabled").value(false));
    }
}
