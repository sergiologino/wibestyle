package ru.wibestyle.api.service;

public interface EmailSender {
    void sendOtpCode(String email, String code);
}
