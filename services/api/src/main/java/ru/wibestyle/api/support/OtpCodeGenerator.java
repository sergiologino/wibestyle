package ru.wibestyle.api.support;

import java.security.SecureRandom;

public final class OtpCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private OtpCodeGenerator() {
    }

    public static String generateNumericCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(RANDOM.nextInt(10));
        }
        return builder.toString();
    }
}
