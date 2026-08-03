package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ru.wibestyle.api.config.SmsProperties;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;

public class SmsAeroSender implements SmsSender {

    private final SmsProperties smsProperties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SmsAeroSender(SmsProperties smsProperties) {
        this(smsProperties, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), new ObjectMapper());
    }

    SmsAeroSender(SmsProperties smsProperties, HttpClient httpClient, ObjectMapper objectMapper) {
        this.smsProperties = smsProperties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void sendOtpCode(String phone, String code) {
        if (!smsProperties.isConfigured()) {
            throw new SmsDeliveryException("SMS_NOT_CONFIGURED");
        }

        String normalizedPhone = phone.replaceAll("[^0-9]", "");
        String message = "Код входа vibestyle.art: " + code;
        String url = smsProperties.getBaseUrl() + "/sms/send"
                + "?number=" + encode(normalizedPhone)
                + "&text=" + encode(message)
                + "&sign=" + encode(smsProperties.getSign())
                + "&channel=" + encode(smsProperties.getChannel());
        String credentials = smsProperties.getEmail() + ":" + smsProperties.getApiKey();
        String authorization = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        try {
            HttpResponse<String> response = httpClient.send(
                    HttpRequest.newBuilder(URI.create(url))
                            .timeout(Duration.ofSeconds(20))
                            .header("Authorization", authorization)
                            .header("Accept", "application/json")
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString()
            );
            JsonNode payload = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || !payload.path("success").asBoolean(false)) {
                String providerMessage = providerMessage(payload);
                logProviderFailure(response.statusCode(), providerMessage);
                throw new SmsDeliveryException(classifyProviderFailure(response.statusCode(), providerMessage));
            }
        } catch (SmsDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new SmsDeliveryException("SMS_PROVIDER_UNAVAILABLE", ex);
        }
    }

    private static String providerMessage(JsonNode payload) {
        String message = payload.path("message").asText("");
        if (message.isBlank()) message = payload.path("error").asText("");
        if (message.isBlank()) message = payload.path("description").asText("");
        return message.replaceAll("[\\r\\n]", " ").trim();
    }

    private static void logProviderFailure(int status, String message) {
        // SMS Aero response text is diagnostic only; never log the authorization header or OTP code.
        org.slf4j.LoggerFactory.getLogger(SmsAeroSender.class)
                .warn("SMS Aero rejected OTP delivery: httpStatus={}, providerMessage={}", status, message);
    }

    private static String classifyProviderFailure(int status, String providerMessage) {
        String normalized = providerMessage.toLowerCase(Locale.ROOT);
        if (status == 401 || status == 403 || containsAny(normalized, "api key", "auth", "credential", "token")) {
            return "SMS_PROVIDER_AUTH_FAILED";
        }
        if (containsAny(normalized, "balance", "credit", "fund", "средств", "баланс")) {
            return "SMS_PROVIDER_INSUFFICIENT_BALANCE";
        }
        if (containsAny(normalized, "sign", "sender", "подпис", "отправител")) {
            return "SMS_PROVIDER_SENDER_REJECTED";
        }
        return "SMS_PROVIDER_REJECTED";
    }

    private static boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
