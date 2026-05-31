package ru.wibestyle.api.billing.yookassa;

public record YooKassaPaymentResult(
        String paymentId,
        String status,
        String confirmationUrl
) {
}
