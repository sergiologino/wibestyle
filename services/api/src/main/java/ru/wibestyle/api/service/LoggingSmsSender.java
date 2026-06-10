package ru.wibestyle.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class LoggingSmsSender implements SmsSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsSender.class);

    @Override
    public void sendOtpCode(String phone, String code) {
        log.info("DEV SMS OTP for {}: {}", phone, code);
    }
}
