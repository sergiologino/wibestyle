package ru.wibestyle.api.service;

public class SmsDeliveryException extends RuntimeException {

    public SmsDeliveryException(String code) {
        super(code);
    }

    public SmsDeliveryException(String code, Throwable cause) {
        super(code, cause);
    }
}
