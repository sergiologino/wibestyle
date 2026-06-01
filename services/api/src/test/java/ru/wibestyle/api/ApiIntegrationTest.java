package ru.wibestyle.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void healthEndpointReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("wibestyle-api"));
    }

    @Test
    void otpFlowCreatesUser() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"+79990001122\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(body);
        String requestId = node.get("requestId").asText();

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"0000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.phone").value("+79990001122"));
    }

    @Test
    void jwtRefreshAndLogoutFlow() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"+79990005566\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String requestId = objectMapper.readTree(body).get("requestId").asText();
        String verifyBody = mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"0000\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode verify = objectMapper.readTree(verifyBody);
        String accessToken = verify.get("accessToken").asText();
        String refreshToken = verify.get("refreshToken").asText();
        org.junit.jupiter.api.Assertions.assertTrue(accessToken.contains("."));

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        String refreshBody = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn().getResponse().getContentAsString();

        String newRefreshToken = objectMapper.readTree(refreshBody).get("refreshToken").asText();
        String newAccess = objectMapper.readTree(refreshBody).get("accessToken").asText();
        mockMvc.perform(get("/api/v1/billing/entitlements").header("Authorization", "Bearer " + newAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entitlements.singleTryOn").value(true));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loggedOut").value(true));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void billingCheckoutCreatesPendingRecord() throws Exception {
        String accessToken = authenticate("+79990004455");
        String body = mockMvc.perform(post("/api/v1/billing/checkout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"wibe\",\"period\":\"monthly\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.plan").value("wibe"))
                .andExpect(jsonPath("$.period").value("monthly"))
                .andExpect(jsonPath("$.checkoutId").exists())
                .andReturn().getResponse().getContentAsString();

        String checkoutId = objectMapper.readTree(body).get("checkoutId").asText();
        mockMvc.perform(get("/api/v1/billing/checkout/" + checkoutId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.provider").value("mock"));

        mockMvc.perform(post("/api/v1/billing/webhooks/mock/simulate?checkoutId=" + checkoutId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.plan").value("wibe"));

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.plan").value("wibe"));
    }

    @Test
    void landingInterestRegistration() throws Exception {
        mockMvc.perform(post("/api/v1/landing/interest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "emailOrPhone": "interest@example.com",
                                  "interest": "early_access",
                                  "page": "/",
                                  "consent": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailOrPhone").value("interest@example.com"))
                .andExpect(jsonPath("$.interest").value("early_access"));
    }

    @Test
    void mediaUploadFlow() throws Exception {
        String accessToken = authenticate("+79990007788");
        String uploadBody = mockMvc.perform(post("/api/v1/media/upload-url")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"purpose\":\"review_photo\",\"contentType\":\"image/jpeg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assetId").exists())
                .andExpect(jsonPath("$.uploadToken").exists())
                .andReturn().getResponse().getContentAsString();

        JsonNode upload = objectMapper.readTree(uploadBody);
        String assetId = upload.get("assetId").asText();
        String uploadToken = upload.get("uploadToken").asText();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                samplePhotoBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/media/assets/" + assetId + "/upload")
                        .file(file)
                        .param("uploadToken", uploadToken)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asset.status").value("uploaded"));

        mockMvc.perform(post("/api/v1/media/complete-upload")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assetId\":\"" + assetId + "\",\"uploadToken\":\"" + uploadToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asset.status").value("ready"));

        mockMvc.perform(get("/api/v1/media/assets/" + assetId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void reviewCreatePublishFlow() throws Exception {
        String accessToken = authenticate("+79990008899");
        String reviewBody = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 5,
                                  "body": "Отличная примерка!",
                                  "displayName": "Аня",
                                  "allowPublish": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review.status").value("pending"))
                .andReturn().getResponse().getContentAsString();

        String reviewId = objectMapper.readTree(reviewBody).get("review").get("id").asText();

        mockMvc.perform(get("/api/v1/reviews/published"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/publish")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review.status").value("published"));

        mockMvc.perform(get("/api/v1/reviews/published"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].displayName").value("Аня"));
    }

    @Test
    void subscribeActivatesPlanInstantly() throws Exception {
        String accessToken = authenticate("+79990004456");
        mockMvc.perform(post("/api/v1/billing/subscribe")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"wibe\",\"period\":\"monthly\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.plan").value("wibe"))
                .andExpect(jsonPath("$.period").value("monthly"));
    }

    @Test
    void landingLeadRegistrationAssignsDiscount() throws Exception {
        mockMvc.perform(post("/api/v1/landing/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phoneOrEmail":"test@example.com",
                                  "consent": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spotNumber").value(1))
                .andExpect(jsonPath("$.hasDiscount").value(true))
                .andExpect(jsonPath("$.priceWithDiscount").value(3495))
                .andExpect(jsonPath("$.remainingSpots").value(99));
    }

    @Test
    void meEndpointReturnsTrialProfile() throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"+79991112233\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String requestId = objectMapper.readTree(body).get("requestId").asText();

        String verifyBody = mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"0000\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String accessToken = objectMapper.readTree(verifyBody).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.trialGenerationsLeft").value(5))
                .andExpect(jsonPath("$.profile.plan").value("trial"));
    }

    @Test
    void parseLinkReturnsProductPreview() throws Exception {
        mockMvc.perform(post("/api/v1/marketplaces/parse-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://www.wildberries.ru/catalog/208285191/detail.aspx\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product.marketplace").value("wildberries"))
                .andExpect(jsonPath("$.product.sizes").isArray());
    }

    @Test
    void avatarFlowCreatesSnapshot() throws Exception {
        String accessToken = authenticate("+79992223344");

        mockMvc.perform(put("/api/v1/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "heightCm": 170,
                                  "bustCm": 90,
                                  "waistCm": 70,
                                  "hipsCm": 98,
                                  "clothingSize": "M",
                                  "privacyFaceHidden": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.anthropometry.heightCm").value(170));

        String avatarBody = mockMvc.perform(post("/api/v1/avatars")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.status").value("DRAFT"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String avatarId = objectMapper.readTree(avatarBody).get("avatar").get("id").asText();
        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "avatar.jpg",
                "image/jpeg",
                samplePhotoBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/avatars/" + avatarId + "/photo")
                        .file(photo)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.status").value("PHOTO_UPLOADED"));

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/validate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qualityScore").exists());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/preprocess")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.status").value("READY"))
                .andExpect(jsonPath("$.avatar.exifRemoved").value(true));

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/activate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snapshotId").exists())
                .andExpect(jsonPath("$.avatar.active").value(true));

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.activeAvatarId").value(avatarId));
    }

    @Test
    void avatarLimitIsThree() throws Exception {
        String accessToken = authenticate("+79996667788");
        createDraftAvatar(accessToken);
        createDraftAvatar(accessToken);
        createDraftAvatar(accessToken);

        mockMvc.perform(post("/api/v1/avatars")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AVATAR_LIMIT_REACHED"));
    }

    @Test
    void avatarRejectsInappropriateFilename() throws Exception {
        String accessToken = authenticate("+79993334455");
        String avatarId = createDraftAvatar(accessToken);

        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "nude-photo.jpg",
                "image/jpeg",
                samplePhotoBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/avatars/" + avatarId + "/photo")
                        .file(photo)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INAPPROPRIATE_PHOTO"));
    }

    @Test
    void activateRequiresAnthropometry() throws Exception {
        String accessToken = authenticate("+79994445566");
        String avatarId = createDraftAvatar(accessToken);

        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "avatar.jpg",
                "image/jpeg",
                samplePhotoBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/avatars/" + avatarId + "/photo")
                        .file(photo)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/validate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/preprocess")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/activate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ANTHROPOMETRY_REQUIRED"));
    }

    @Test
    void deleteAvatarMarksDeleted() throws Exception {
        String accessToken = authenticate("+79995556677");
        String avatarId = createDraftAvatar(accessToken);

        mockMvc.perform(delete("/api/v1/avatars/" + avatarId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.status").value("DELETED"));
    }

    @Test
    void parseLinkRejectsUnsupportedMarketplace() throws Exception {
        mockMvc.perform(post("/api/v1/marketplaces/parse-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"https://market.yandex.ru/product/123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MARKETPLACE_UNSUPPORTED"));
    }

    @Test
    void tryOnLinkFlowGeneratesResult() throws Exception {
        String accessToken = authenticate("+79996667788");
        activateAvatar(accessToken);

        String sessionBody = mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://www.wildberries.ru/catalog/123/detail.aspx",
                                  "selectedSize": "M"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session.status").value("draft"))
                .andExpect(jsonPath("$.product.marketplace").value("wildberries"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String sessionId = objectMapper.readTree(sessionBody).get("session").get("id").asText();

        mockMvc.perform(post("/api/v1/try-on/sessions/" + sessionId + "/generate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session.status").value("ready"))
                .andExpect(jsonPath("$.result.afterImageUrl").value("/assets/demo-after.svg"))
                .andExpect(jsonPath("$.trialGenerationsLeft").value(4));

        mockMvc.perform(get("/api/v1/try-on/sessions/" + sessionId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.beforeImageUrl").exists());
    }

    @Test
    void tryOnRequiresActiveAvatar() throws Exception {
        String accessToken = authenticate("+79997778899");

        mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://www.ozon.ru/product/demo-item",
                                  "selectedSize": "M"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AVATAR_NOT_READY"));
    }

    @Test
    void searchReturnsMarketplaceItems() throws Exception {
        mockMvc.perform(post("/api/v1/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"найди модный пиджак на лето 2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.facets.category").value("jacket"));
    }

    @Test
    void favoritesCrudWorks() throws Exception {
        String accessToken = authenticate("+79998887766");

        mockMvc.perform(post("/api/v1/favorites")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "marketplace": "wildberries",
                                  "externalProductId": "wb_demo_1",
                                  "title": "Пиджак",
                                  "brand": "Urban Line",
                                  "priceRub": 6890,
                                  "sizes": ["S","M","L"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite.externalProductId").value("wb_demo_1"));

        mockMvc.perform(get("/api/v1/favorites").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void sizeAdviceReturnsWarnings() throws Exception {
        String accessToken = authenticate("+79987776655");
        mockMvc.perform(put("/api/v1/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"heightCm":170,"bustCm":95,"waistCm":76,"hipsCm":100}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/size-advice")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "marketplace": "ozon",
                                  "selectedSize": "S",
                                  "availableSizes": ["S","M","L"],
                                  "reviewSignals": ["runs_small"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.advice.status").value("warning"))
                .andExpect(jsonPath("$.advice.reasons").isArray());
    }

    @Test
    void galleryPostFromTryOnSession() throws Exception {
        String accessToken = authenticate("+79986675544");
        activateAvatar(accessToken);

        String sessionBody = mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"url":"https://www.wildberries.ru/catalog/555/detail.aspx","selectedSize":"M"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(sessionBody).get("session").get("id").asText();

        mockMvc.perform(post("/api/v1/try-on/sessions/" + sessionId + "/generate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/gallery/posts")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tryOnSessionId": "%s",
                                  "visibility": "public",
                                  "productLinkVisible": true
                                }
                                """.formatted(sessionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.post.slug").exists());

        mockMvc.perform(get("/api/v1/gallery/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void billingPlansExposeWibeAnnualDefault() throws Exception {
        mockMvc.perform(get("/api/v1/billing/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultSelection.plan").value("wibe"))
                .andExpect(jsonPath("$.defaultSelection.period").value("annual"))
                .andExpect(jsonPath("$.items[?(@.plan=='wibe' && @.period=='annual')].basePriceRub").value(3840));
    }

    @Test
    void promoCodeAdminCreateRedeemAndRevoke() throws Exception {
        String expiresAt = java.time.Instant.now().plus(java.time.Duration.ofDays(30)).toString();

        mockMvc.perform(post("/api/v1/admin/promo-codes")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "VKTEST20",
                                  "discountPercent": 20,
                                  "maxUses": 2,
                                  "expiresAt": "%s",
                                  "label": "VK"
                                }
                                """.formatted(expiresAt)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promo.code").value("VKTEST20"));

        mockMvc.perform(post("/api/v1/billing/promo/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"VKTEST20\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.discountPercent").value(20));

        String accessToken = authenticateWithPromo("+79991112200", "VKTEST20");
        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.promoDiscountPercent").value(20));

        mockMvc.perform(get("/api/v1/billing/plans").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promoDiscountPercent").value(20));

        String promoId = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/admin/promo-codes").header("X-Admin-Key", "test-admin-key"))
                        .andReturn().getResponse().getContentAsString()
        ).get("items").get(0).get("id").asText();

        mockMvc.perform(post("/api/v1/admin/promo-codes/" + promoId + "/revoke")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/billing/promo/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"VKTEST20\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PROMO_REVOKED"));
    }

    @Test
    void promoRejectsCyrillicKeyboard() throws Exception {
        mockMvc.perform(post("/api/v1/billing/promo/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"VК2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PROMO_CYRILLIC_KEYBOARD"));
    }

    @Test
    void subscribeActivatesWibePlan() throws Exception {
        String accessToken = authenticate("+79990003344");
        mockMvc.perform(post("/api/v1/billing/subscribe")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"wibe\",\"period\":\"annual\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("wibe"))
                .andExpect(jsonPath("$.planGenerationsLeft").value(20));

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.plan").value("wibe"))
                .andExpect(jsonPath("$.entitlements.multiItemTryOn").value(false));
    }

    @Test
    void adminLeadsListExportAndStatusUpdate() throws Exception {
        String email = "lead-admin-" + System.nanoTime() + "@test.com";
        mockMvc.perform(post("/api/v1/landing/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phoneOrEmail":"%s",
                                  "consent": true,
                                  "page": "/",
                                  "utmSource": "vk"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("new"));

        String listBody = mockMvc.perform(get("/api/v1/admin/leads")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String leadId = null;
        for (JsonNode item : objectMapper.readTree(listBody).get("items")) {
            if (email.equals(item.get("phoneOrEmail").asText())) {
                leadId = item.get("id").asText();
                break;
            }
        }
        if (leadId == null) {
            throw new AssertionError("Lead not found for " + email);
        }

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                                "/api/v1/admin/leads/" + leadId + "/status")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"contacted\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lead.status").value("contacted"));

        mockMvc.perform(get("/api/v1/admin/leads/export.csv")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Content-Disposition", org.hamcrest.Matchers.containsString("landing-leads.csv")));
    }

    @Test
    void adminReviewDisplayNameUpdate() throws Exception {
        String accessToken = authenticate("+79990009911");
        String reviewBody = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rating": 4,
                                  "body": "Хорошая примерка",
                                  "displayName": "Маша",
                                  "allowPublish": true
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String reviewId = objectMapper.readTree(reviewBody).get("review").get("id").asText();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                                "/api/v1/admin/reviews/" + reviewId + "/display-name")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Мария из Москвы\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review.displayName").value("Мария из Москвы"));
    }

    @Test
    void galleryReportAndHideRemovesFromPublicList() throws Exception {
        String accessToken = authenticate("+79990006655");
        activateAvatar(accessToken);
        String sessionBody = mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"url":"https://www.wildberries.ru/catalog/777/detail.aspx","selectedSize":"M"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(sessionBody).get("session").get("id").asText();
        mockMvc.perform(post("/api/v1/try-on/sessions/" + sessionId + "/generate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        String postBody = mockMvc.perform(post("/api/v1/gallery/posts")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tryOnSessionId": "%s",
                                  "visibility": "public",
                                  "productLinkVisible": true
                                }
                                """.formatted(sessionId)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String postId = objectMapper.readTree(postBody).get("post").get("id").asText();

        mockMvc.perform(get("/api/v1/gallery/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        mockMvc.perform(post("/api/v1/gallery/posts/" + postId + "/report")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"spam\",\"details\":\"test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.report.status").value("open"));

        mockMvc.perform(post("/api/v1/gallery/posts/" + postId + "/report")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"inappropriate\",\"details\":\"anonymous guest\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.report.status").value("open"))
                .andExpect(jsonPath("$.report.reporterUserId").doesNotExist());

        mockMvc.perform(post("/api/v1/admin/gallery/posts/" + postId + "/hide")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.post.moderationStatus").value("HIDDEN"));

        mockMvc.perform(get("/api/v1/gallery/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void adminDeleteGalleryPostRemovesFromPublicList() throws Exception {
        String accessToken = authenticate("+79990007788");
        activateAvatar(accessToken);
        String sessionBody = mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"url":"https://www.wildberries.ru/catalog/888/detail.aspx","selectedSize":"M"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(sessionBody).get("session").get("id").asText();
        mockMvc.perform(post("/api/v1/try-on/sessions/" + sessionId + "/generate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        String postBody = mockMvc.perform(post("/api/v1/gallery/posts")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tryOnSessionId": "%s",
                                  "visibility": "public",
                                  "productLinkVisible": true
                                }
                                """.formatted(sessionId)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String postId = objectMapper.readTree(postBody).get("post").get("id").asText();

        mockMvc.perform(delete("/api/v1/admin/gallery/posts/" + postId)
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true));

        mockMvc.perform(get("/api/v1/gallery/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void listMyTryOnSessionsReturnsReadyHistory() throws Exception {
        String accessToken = authenticate("+79990008899");
        activateAvatar(accessToken);

        mockMvc.perform(get("/api/v1/try-on/sessions/mine")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        String sessionBody = mockMvc.perform(post("/api/v1/try-on/sessions/link")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"url":"https://www.wildberries.ru/catalog/999/detail.aspx","selectedSize":"M"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(sessionBody).get("session").get("id").asText();

        mockMvc.perform(post("/api/v1/try-on/sessions/" + sessionId + "/generate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/try-on/sessions/mine")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].sessionId").value(sessionId))
                .andExpect(jsonPath("$.items[0].afterImageUrl").exists());
    }

    @Test
    void deleteAccountRemovesUser() throws Exception {
        String accessToken = authenticate("+79990005544");
        mockMvc.perform(post("/api/v1/profile/delete-account")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"confirm\":\"DELETE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true));

        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }

    private void activateAvatar(String accessToken) throws Exception {
        mockMvc.perform(put("/api/v1/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "heightCm": 170,
                                  "bustCm": 90,
                                  "waistCm": 70,
                                  "hipsCm": 98
                                }
                                """))
                .andExpect(status().isOk());

        String avatarId = createDraftAvatar(accessToken);
        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "avatar.jpg",
                "image/jpeg",
                samplePhotoBytes()
        );

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/avatars/" + avatarId + "/photo")
                        .file(photo)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/validate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/preprocess")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/avatars/" + avatarId + "/activate")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    private String authenticate(String phone) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"" + phone + "\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String requestId = objectMapper.readTree(body).get("requestId").asText();
        String verifyBody = mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"0000\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(verifyBody).get("accessToken").asText();
    }

    private String authenticateWithPromo(String phone, String promoCode) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/otp/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"" + phone + "\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String requestId = objectMapper.readTree(body).get("requestId").asText();
        String verifyBody = mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"code\":\"0000\",\"promoCode\":\"" + promoCode + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.promo.redeemed").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(verifyBody).get("accessToken").asText();
    }

    private String createDraftAvatar(String accessToken) throws Exception {
        String avatarBody = mockMvc.perform(post("/api/v1/avatars")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(avatarBody).get("avatar").get("id").asText();
    }

    private byte[] samplePhotoBytes() {
        byte[] bytes = new byte[25000];
        java.util.Arrays.fill(bytes, (byte) 0xFF);
        return bytes;
    }

    @Test
    void passwordRegisterAndLoginFlow() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "login": "testuser01",
                                  "email": "testuser01@example.com",
                                  "password": "Secret123",
                                  "captchaId": "skip",
                                  "captchaAnswer": "0",
                                  "displayName": "Test User"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.newUser").value(true));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "identifier": "testuser01",
                                  "password": "Secret123",
                                  "captchaId": "skip",
                                  "captchaAnswer": "0"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.newUser").value(false));
    }

    @Test
    void adminCanOverrideSubscriptionAndDeleteUser() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "login": "deleteme",
                                  "password": "Secret123",
                                  "captchaId": "skip",
                                  "captchaAnswer": "0"
                                }
                                """))
                .andExpect(status().isOk());

        String listBody = mockMvc.perform(get("/api/v1/admin/users")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String userId = null;
        for (JsonNode item : objectMapper.readTree(listBody).get("items")) {
            if (item.hasNonNull("login") && "deleteme".equals(item.get("login").asText())) {
                userId = item.get("id").asText();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(userId);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/admin/users/" + userId + "/subscription")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plan\":\"elite\",\"planGenerationsLeft\":100}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("elite"));

        mockMvc.perform(post("/api/v1/admin/users/" + userId + "/impersonate")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.impersonated").value(true))
                .andExpect(jsonPath("$.accessToken").exists());

        mockMvc.perform(delete("/api/v1/admin/users/" + userId)
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true));
    }

    @Test
    void adminCanLoadUserSupportDetail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "login": "supportview",
                                  "password": "Secret123",
                                  "captchaId": "skip",
                                  "captchaAnswer": "0"
                                }
                                """))
                .andExpect(status().isOk());

        String listBody = mockMvc.perform(get("/api/v1/admin/users")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String userId = null;
        for (JsonNode item : objectMapper.readTree(listBody).get("items")) {
            if (item.hasNonNull("login") && "supportview".equals(item.get("login").asText())) {
                userId = item.get("id").asText();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(userId);

        mockMvc.perform(get("/api/v1/admin/users/" + userId)
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(userId))
                .andExpect(jsonPath("$.profile.plan").value("trial"))
                .andExpect(jsonPath("$.avatars.items").isArray())
                .andExpect(jsonPath("$.tryOnSessions.items").isArray());

        jdbcTemplate.update("DELETE FROM user_profiles WHERE user_id = ?", userId);

        mockMvc.perform(get("/api/v1/admin/users/" + userId)
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.plan").value("trial"));
    }

    @Test
    void adminCanLoadUserSupportDetailWithDuplicateGalleryPosts() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "login": "dupgallery",
                                  "password": "Secret123",
                                  "captchaId": "skip",
                                  "captchaAnswer": "0"
                                }
                                """))
                .andExpect(status().isOk());

        String listBody = mockMvc.perform(get("/api/v1/admin/users")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String userId = null;
        for (JsonNode item : objectMapper.readTree(listBody).get("items")) {
            if (item.hasNonNull("login") && "dupgallery".equals(item.get("login").asText())) {
                userId = item.get("id").asText();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(userId);

        UUID sessionId = UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO try_on_sessions (
                    id, user_id, source_type, status, visibility,
                    created_at, updated_at, quota_reserved, quota_consumed, video_status
                ) VALUES (?, ?, 'MARKETPLACE_LINK', 'READY', 'private', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, FALSE, 'none')
                """, sessionId, UUID.fromString(userId));

        jdbcTemplate.update("""
                INSERT INTO gallery_posts (
                    id, user_id, slug, visibility, moderation_status, try_on_session_id,
                    created_at, updated_at, media_type
                ) VALUES (?, ?, 'dup-gallery-a', 'public', 'PUBLIC', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'image')
                """, UUID.randomUUID(), UUID.fromString(userId), sessionId);
        jdbcTemplate.update("""
                INSERT INTO gallery_posts (
                    id, user_id, slug, visibility, moderation_status, try_on_session_id,
                    created_at, updated_at, media_type
                ) VALUES (?, ?, 'dup-gallery-b', 'unlisted', 'PUBLIC', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'image')
                """, UUID.randomUUID(), UUID.fromString(userId), sessionId);

        mockMvc.perform(get("/api/v1/admin/users/" + userId)
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tryOnSessions.items[?(@.sessionId=='" + sessionId + "')].galleryPostCount")
                        .value(2))
                .andExpect(jsonPath("$.tryOnSessions.items[?(@.sessionId=='" + sessionId + "')].galleryVisibility")
                        .exists());
    }

    @Test
    void adminAiLogsEndpoint_isRegistered() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ai-logs")
                        .header("X-Admin-Key", "test-admin-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }
}
