package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ru.wibestyle.api.config.SmsProperties;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class SmsRuSender implements SmsSender {

    private final SmsProperties smsProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SmsRuSender(SmsProperties smsProperties) {
        this.smsProperties = smsProperties;
    }

    @Override
    public void sendOtpCode(String phone, String code) {
        if (!smsProperties.isConfigured()) {
            throw new IllegalStateException("SMS_NOT_CONFIGURED");
        }
        String normalizedPhone = phone.replaceAll("[^0-9]", "");
        String message = "Код входа vibestyle.art: " + code;
        String url = "https://sms.ru/sms/send?api_id=" + encode(smsProperties.getApiId())
                + "&to=" + encode(normalizedPhone)
                + "&msg=" + encode(message)
                + "&json=1";
        try {
            String body = java.net.http.HttpClient.newHttpClient().send(
                    java.net.http.HttpRequest.newBuilder(URI.create(url)).GET().build(),
                    java.net.http.HttpResponse.BodyHandlers.ofString()
            ).body();
            JsonNode response = objectMapper.readTree(body);
            if (!"OK".equalsIgnoreCase(response.path("status").asText())) {
                throw new IllegalStateException("SMS_SEND_FAILED");
            }
        } catch (Exception ex) {
            throw new IllegalStateException("SMS_SEND_FAILED", ex);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
