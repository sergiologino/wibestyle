package ru.wibestyle.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MarketingAttributionIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired EntityManager entityManager;

    @Test
    void preservesFirstAndLastTouchAndAttachesSmsUser() throws Exception {
        String visitorId = "marketing-test-visitor";
        visit(visitorId, "telegram", "messenger");
        visit(visitorId, "ya", "cpc");

        String otpBody = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"+79990007891\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(otpBody).get("requestId").asText();

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requestId":"%s","code":"0000","visitorId":"%s"}
                                """.formatted(requestId, visitorId)))
                .andExpect(status().isOk());
        entityManager.flush();

        var touches = jdbcTemplate.queryForMap("""
                SELECT first_visit.utm_source AS first_source, last_visit.utm_source AS last_source
                FROM users u
                JOIN marketing_visits first_visit ON first_visit.id = u.first_marketing_visit_id
                JOIN marketing_visits last_visit ON last_visit.id = u.last_marketing_visit_id
                WHERE u.phone = '+79990007891'
                """);
        assertThat(touches.get("first_source")).isEqualTo("telegram");
        assertThat(touches.get("last_source")).isEqualTo("ya");

        mockMvc.perform(get("/api/v1/admin/marketing/stats").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    private void visit(String visitorId, String source, String medium) throws Exception {
        mockMvc.perform(post("/api/marketing/visit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "visitorId":"%s",
                                  "firstTouch":{"utm_source":"telegram","utm_medium":"messenger"},
                                  "lastTouch":{"utm_source":"%s","utm_medium":"%s"}
                                }
                                """.formatted(visitorId, source, medium)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.accepted").value(true));
    }
}
