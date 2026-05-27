package ru.wibestyle.api.support;

import jakarta.servlet.http.HttpServletRequest;

public final class RequestSupport {

    private RequestSupport() {
    }

    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
