package ru.wibestyle.api.controller;



import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;

import ru.wibestyle.api.domain.LandingLeadEntity;

import ru.wibestyle.api.dto.CreateInterestRequest;

import ru.wibestyle.api.dto.CreateLeadRequest;

import ru.wibestyle.api.service.InterestService;

import ru.wibestyle.api.service.LeadService;



import java.util.Map;



@RestController

@RequestMapping("/api/v1/landing")

public class LandingController {



    private final LeadService leadService;

    private final InterestService interestService;



    public LandingController(LeadService leadService, InterestService interestService) {

        this.leadService = leadService;

        this.interestService = interestService;

    }



    @GetMapping("/leads")

    public Map<String, Object> stats() {

        return leadService.publicStats();

    }



    @PostMapping("/leads")

    public Map<String, Object> create(@Valid @RequestBody CreateLeadRequest request) {

        LandingLeadEntity lead = leadService.register(request);

        Map<String, Object> response = leadService.toLeadMap(lead);
        response.putAll(leadService.publicStats());

        return response;

    }



    @PostMapping("/interest")

    public Map<String, Object> registerInterest(@Valid @RequestBody CreateInterestRequest request) {

        return interestService.register(request);

    }

}


