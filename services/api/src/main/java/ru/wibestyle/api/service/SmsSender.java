package ru.wibestyle.api.service;

public interface SmsSender {
    void sendOtpCode(String phone, String code);
}
