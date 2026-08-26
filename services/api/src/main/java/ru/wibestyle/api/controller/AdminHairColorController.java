package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AdminSupport;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/hair-colors")
public class AdminHairColorController {
    private static final String DEFAULT_ATTRIBUTION = "Фото оттенка добавлено администратором.";

    private final HairColorCatalogRepository repo;
    private final BlobStorage storage;
    private final AdminProperties admin;

    public AdminHairColorController(HairColorCatalogRepository repo, BlobStorage storage, AdminProperties admin) {
        this.repo = repo;
        this.storage = storage;
        this.admin = admin;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        AdminSupport.requireAdminKey(key, admin);
        return Map.of("items", repo.findAllByOrderBySortOrderAsc().stream().map(this::map).toList());
    }

    @PostMapping
    public Map<String, Object> create(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                      @RequestBody Map<String, String> body) {
        AdminSupport.requireAdminKey(key, admin);
        String slug = AdminHairstyleController.requireSlug(body.get("slug"));
        if (repo.findBySlug(slug).isPresent()) throw new IllegalArgumentException("HAIR_COLOR_SLUG_EXISTS");

        Instant now = Instant.now();
        var entity = new HairColorCatalogEntity(
                UUID.randomUUID(),
                slug,
                AdminHairstyleController.value(body, "title", slug),
                AdminHairstyleController.value(body, "family", "Другие"),
                AdminHairstyleController.value(body, "description", ""),
                AdminHairstyleController.value(body, "aiDirective", "change only hair color to " + slug),
                "catalog/hair-colors/" + slug + ".jpg",
                AdminHairstyleController.value(body, "sourceBrand", "Custom"),
                AdminHairstyleController.value(body, "sourceUrl", ""),
                AdminHairstyleController.value(body, "attributionText", DEFAULT_ATTRIBUTION),
                AdminHairstyleController.intValue(body, "sortOrder", 999),
                now
        );
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @PutMapping("/{slug}")
    public Map<String, Object> update(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                      @PathVariable String slug,
                                      @RequestBody Map<String, String> body) {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
        entity.updateAdminData(
                AdminHairstyleController.value(body, "title", entity.getTitle()),
                AdminHairstyleController.value(body, "family", entity.getFamily()),
                AdminHairstyleController.value(body, "description", entity.getDescription()),
                AdminHairstyleController.value(body, "aiDirective", entity.getAiDirective()),
                AdminHairstyleController.value(body, "sourceBrand", entity.getSourceBrand()),
                AdminHairstyleController.value(body, "sourceUrl", entity.getSourceUrl()),
                AdminHairstyleController.value(body, "attributionText", entity.getAttributionText()),
                AdminHairstyleController.intValue(body, "sortOrder", entity.getSortOrder()),
                AdminHairstyleController.booleanValue(body, "active", entity.isActive())
        );
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @DeleteMapping("/{slug}")
    public Map<String, Object> deactivate(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                          @PathVariable String slug) {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
        entity.deactivate(Instant.now());
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @PostMapping("/{slug}/image")
    public Map<String, Object> image(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                     @PathVariable String slug,
                                     @RequestParam MultipartFile image) throws Exception {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
        String path = "catalog/hair-colors/" + slug + AdminHairstyleController.extension(image);
        storage.put(path, image.getInputStream());
        entity.setImagePath(path);
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @GetMapping("/{slug}/image")
    public ResponseEntity<Resource> image(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                          @PathVariable String slug) throws Exception {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
        if (!storage.exists(entity.getImagePath())) throw new IllegalArgumentException("IMAGE_NOT_FOUND");
        Path path = storage.resolveLocalFile(entity.getImagePath());
        return ResponseEntity.ok().contentType(HairstyleController.mediaType(path)).body(new FileSystemResource(path));
    }

    private Map<String, Object> map(HairColorCatalogEntity color) {
        return Map.ofEntries(
                Map.entry("id", color.getSlug()),
                Map.entry("title", color.getTitle()),
                Map.entry("family", color.getFamily()),
                Map.entry("description", color.getDescription()),
                Map.entry("aiDirective", color.getAiDirective()),
                Map.entry("imagePath", color.getImagePath()),
                Map.entry("imageUrl", "/api/v1/hair-colors/" + color.getSlug() + "/image?v=" + color.getUpdatedAt().toEpochMilli()),
                Map.entry("adminImageUrl", "/api/v1/admin/hair-colors/" + color.getSlug() + "/image?v=" + color.getUpdatedAt().toEpochMilli()),
                Map.entry("sourceBrand", color.getSourceBrand()),
                Map.entry("sourceUrl", color.getSourceUrl()),
                Map.entry("attributionText", color.getAttributionText()),
                Map.entry("sortOrder", color.getSortOrder()),
                Map.entry("active", color.isActive())
        );
    }
}
