package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/hair-colors")
public class HairColorController {
    private static final CacheControl PUBLIC_CATALOG_CACHE = CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic();
    private final HairColorCatalogRepository colors;
    private final BlobStorage storage;

    public HairColorController(HairColorCatalogRepository colors, BlobStorage storage) {
        this.colors = colors;
        this.storage = storage;
    }

    @GetMapping("/catalog")
    public Map<String, Object> catalog() {
        return Map.of("items", colors.findByActiveTrueOrderBySortOrderAsc().stream().map(c -> Map.of(
                "id", c.getSlug(),
                "title", c.getTitle(),
                "family", c.getFamily(),
                "description", c.getDescription(),
                "imageUrl", "/api/v1/hair-colors/" + c.getSlug() + "/image?v=" + c.getUpdatedAt().toEpochMilli(),
                "sourceBrand", c.getSourceBrand(),
                "sourceUrl", c.getSourceUrl(),
                "attributionText", c.getAttributionText()
        )).toList());
    }

    @GetMapping("/{slug}/image")
    public ResponseEntity<Resource> image(@PathVariable String slug) throws Exception {
        var color = colors.findBySlug(slug).filter(c -> c.isActive()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!storage.exists(color.getImagePath())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path path = storage.resolveLocalFile(color.getImagePath());
        return ResponseEntity.ok()
                .cacheControl(PUBLIC_CATALOG_CACHE)
                .contentType(HairstyleController.mediaType(path))
                .body(new FileSystemResource(path));
    }
}
