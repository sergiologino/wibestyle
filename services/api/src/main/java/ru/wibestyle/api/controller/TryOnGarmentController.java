package ru.wibestyle.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.ai.GarmentClassifierService;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/try-on")
public class TryOnGarmentController {

    private final GarmentClassifierService garmentClassifierService;

    public TryOnGarmentController(GarmentClassifierService garmentClassifierService) {
        this.garmentClassifierService = garmentClassifierService;
    }

    @PostMapping("/classify-garment")
    public Map<String, Object> classifyGarment(@RequestParam("photo") MultipartFile photo) {
        try {
            return Map.of("classification", garmentClassifierService.classify(photo).toMap());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PHOTO_REQUIRED", ex);
        }
    }
}
