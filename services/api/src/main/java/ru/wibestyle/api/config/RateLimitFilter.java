package ru.wibestyle.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.wibestyle.api.support.RequestSupport;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(2)
public class RateLimitFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!securityProperties.isRateLimitEnabled()) {
            return true;
        }
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !request.getRequestURI().endsWith("/api/v1/auth/otp/start");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String key = RequestSupport.clientIp(request);
        long minute = Instant.now().getEpochSecond() / 60;
        Window window = buckets.compute(key, (ip, current) -> {
            if (current == null || current.minute() != minute) {
                return new Window(minute, 1);
            }
            return new Window(minute, current.count() + 1);
        });

        if (window.count() > securityProperties.getOtpStartPerMinute()) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests\",\"code\":\"RATE_LIMIT_EXCEEDED\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private record Window(long minute, int count) {
    }
}
