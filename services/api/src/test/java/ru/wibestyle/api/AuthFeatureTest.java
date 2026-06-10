package ru.wibestyle.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFeatureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void emailOtpFlowCreatesUser() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/email-otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"otp.user@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String requestId = objectMapper.readTree(body).get("requestId").asText();

        mockMvc.perform(post("/api/v1/auth/email-otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value("otp.user@example.com"))
                .andExpect(jsonPath("$.newUser").value(true));
    }

    @Test
    void passwordRegisterEndpointRemoved() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"x\",\"password\":\"Secret123\",\"captchaId\":\"skip\",\"captchaAnswer\":\"0\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void googleOAuthHiddenForRussianIp() throws Exception {
        jdbcTemplate.update("UPDATE platform_settings SET setting_value = 'false' WHERE setting_key = 'block_google_oauth'");

        mockMvc.perform(get("/api/v1/auth/oauth/providers").header("CF-IPCountry", "RU"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.google.enabled").value(false))
                .andExpect(jsonPath("$.yandex.enabled").value(true));
    }

    @Test
    void googleOAuthHiddenWhenAdminBlocks() throws Exception {
        jdbcTemplate.update("UPDATE platform_settings SET setting_value = 'true' WHERE setting_key = 'block_google_oauth'");

        mockMvc.perform(get("/api/v1/auth/oauth/providers").header("CF-IPCountry", "US"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.google.enabled").value(false));
    }

    @Test
    void googleOAuthVisibleWhenAllowed() throws Exception {
        jdbcTemplate.update("UPDATE platform_settings SET setting_value = 'false' WHERE setting_key = 'block_google_oauth'");

        mockMvc.perform(get("/api/v1/auth/oauth/providers").header("CF-IPCountry", "US"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.google.enabled").value(true));
    }

    @Test
    void adminCanToggleBlockGoogleOAuth() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/settings")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"blockGoogleOAuth\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blockGoogleOAuth").value(true));

        mockMvc.perform(get("/api/v1/admin/settings").header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blockGoogleOAuth").value(true));
    }

    @Test
    void googleOAuthStartRejectedWhenBlocked() throws Exception {
        jdbcTemplate.update("UPDATE platform_settings SET setting_value = 'true' WHERE setting_key = 'block_google_oauth'");

        mockMvc.perform(get("/api/v1/auth/oauth/google/start").header("CF-IPCountry", "US"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oauthStartAcceptsMobileReturnUrl() throws Exception {
        jdbcTemplate.update("UPDATE platform_settings SET setting_value = 'false' WHERE setting_key = 'block_google_oauth'");

        mockMvc.perform(get("/api/v1/auth/oauth/yandex/start")
                        .param("returnUrl", "wibestyle://auth/oauth/callback")
                        .header("CF-IPCountry", "US"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationUrl").exists())
                .andExpect(jsonPath("$.state").exists());
    }

}
