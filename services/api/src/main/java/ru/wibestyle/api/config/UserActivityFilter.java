package ru.wibestyle.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.wibestyle.api.service.UserActivityService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.util.UUID;

@Component
public class UserActivityFilter extends OncePerRequestFilter {
    private final UserActivityService activityService;

    public UserActivityFilter(UserActivityService activityService) {
        this.activityService = activityService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/v1/")
                || path.startsWith("/api/v1/admin/")
                || path.startsWith("/api/v1/health")
                || path.startsWith("/api/v1/notifications/push-devices");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            UUID userId = AuthSupport.optionalUserId(request.getHeader("Authorization"));
            if (userId != null) {
                activityService.recordSeen(userId);
            }
        } catch (RuntimeException ignored) {
            // Activity tracking must never block the user request.
        }
        filterChain.doFilter(request, response);
    }
}
