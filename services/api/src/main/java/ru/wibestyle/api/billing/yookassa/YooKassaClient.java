package ru.wibestyle.api.billing.yookassa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import ru.wibestyle.api.config.BillingProperties;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class YooKassaClient {

    private final BillingProperties billingProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public YooKassaClient(BillingProperties billingProperties, ObjectMapper objectMapper) {
        this.billingProperties = billingProperties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(billingProperties.getYookassa().getApiBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public YooKassaPaymentResult createRedirectPayment(
            UUID checkoutId,
            int priceRub,
            String description,
            UUID userId
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", Map.of(
                "value", formatRub(priceRub),
                "currency", "RUB"
        ));
        body.put("capture", true);
        body.put("description", description);
        body.put("confirmation", Map.of(
                "type", "redirect",
                "return_url", billingProperties.getReturnUrl()
        ));
        body.put("metadata", Map.of(
                "checkout_id", checkoutId.toString(),
                "user_id", userId.toString()
        ));

        JsonNode response = post("/v3/payments", checkoutId.toString(), body);
        String paymentId = requiredText(response, "id");
        String status = requiredText(response, "status");
        String confirmationUrl = response.path("confirmation").path("confirmation_url").asText(null);
        if (confirmationUrl == null || confirmationUrl.isBlank()) {
            throw new IllegalStateException("YOOKASSA_CONFIRMATION_URL_MISSING");
        }
        return new YooKassaPaymentResult(paymentId, status, confirmationUrl);
    }

    public JsonNode fetchPayment(String paymentId) {
        return get("/v3/payments/" + paymentId);
    }

    private JsonNode post(String path, String idempotenceKey, Map<String, Object> body) {
        try {
            String json = objectMapper.writeValueAsString(body);
            return restClient.post()
                    .uri(path)
                    .header(HttpHeaders.AUTHORIZATION, basicAuth())
                    .header("Idempotence-Key", idempotenceKey)
                    .body(json)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("YOOKASSA_REQUEST_FAILED:" + ex.getStatusCode().value(), ex);
        } catch (Exception ex) {
            throw new IllegalStateException("YOOKASSA_REQUEST_FAILED", ex);
        }
    }

    private JsonNode get(String path) {
        try {
            return restClient.get()
                    .uri(path)
                    .header(HttpHeaders.AUTHORIZATION, basicAuth())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("YOOKASSA_REQUEST_FAILED:" + ex.getStatusCode().value(), ex);
        }
    }

    private String basicAuth() {
        BillingProperties.YooKassa config = billingProperties.getYookassa();
        String token = config.getShopId() + ":" + config.getSecretKey();
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private static String formatRub(int priceRub) {
        return BigDecimal.valueOf(priceRub)
                .setScale(2, RoundingMode.UNNECESSARY)
                .toPlainString();
    }

    private static String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("YOOKASSA_RESPONSE_INVALID:" + field);
        }
        return value;
    }
}
