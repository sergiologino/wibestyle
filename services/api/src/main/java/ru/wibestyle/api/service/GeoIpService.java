package ru.wibestyle.api.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.GeoIpProperties;

@Service
public class GeoIpService {

    private final GeoIpProperties geoIpProperties;

    public GeoIpService(GeoIpProperties geoIpProperties) {
        this.geoIpProperties = geoIpProperties;
    }

    public String resolveCountryCode(HttpServletRequest request) {
        String fromHeader = firstCountryHeader(request, "CF-IPCountry");
        if (fromHeader != null) {
            return fromHeader;
        }
        fromHeader = firstCountryHeader(request, "X-Country-Code");
        if (fromHeader != null) {
            return fromHeader;
        }
        fromHeader = firstCountryHeader(request, "X-Test-Country");
        if (fromHeader != null) {
            return fromHeader;
        }
        return geoIpProperties.getDefaultCountry();
    }

    public boolean isRussian(HttpServletRequest request) {
        return "RU".equals(resolveCountryCode(request));
    }

    private String firstCountryHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }
}
