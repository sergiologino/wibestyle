package ru.wibestyle.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.MarketingEventRequest;
import ru.wibestyle.api.dto.MarketingVisitRequest;
import ru.wibestyle.api.service.MarketingAttributionService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;

@RestController
@RequestMapping({"/api/marketing", "/api/v1/marketing"})
public class MarketingController {
    private final MarketingAttributionService service;

    public MarketingController(MarketingAttributionService service) { this.service = service; }

    @PostMapping("/visit")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> visit(@Valid @RequestBody MarketingVisitRequest request, HttpServletRequest httpRequest) {
        var visit = service.recordVisit(request, httpRequest);
        return Map.of("accepted", true, "visitId", visit.getId());
    }

    @PostMapping("/event")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> event(@Valid @RequestBody MarketingEventRequest request,
                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
        service.recordEvent(request, AuthSupport.optionalUserId(authorization));
        return Map.of("accepted", true);
    }
}
