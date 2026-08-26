package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AdminSupport;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/hairstyles")
public class AdminHairstyleController {
    private final HairstyleCatalogRepository repo;
    private final BlobStorage storage;
    private final AdminProperties admin;

    public AdminHairstyleController(HairstyleCatalogRepository repo, BlobStorage storage, AdminProperties admin) {
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
        String slug = requireSlug(body.get("slug"));
        if (repo.findBySlug(slug).isPresent()) throw new IllegalArgumentException("HAIRSTYLE_SLUG_EXISTS");

        Instant now = Instant.now();
        var entity = new HairstyleCatalogEntity(
                UUID.randomUUID(),
                slug,
                value(body, "title", slug),
                value(body, "description", ""),
                value(body, "type", "medium"),
                value(body, "masterNote", ""),
                value(body, "aiDirective", ""),
                "catalog/hairstyles/" + slug + ".jpg",
                intValue(body, "sortOrder", 999),
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
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        entity.update(
                value(body, "title", entity.getTitle()),
                value(body, "description", entity.getDescription()),
                value(body, "type", entity.getHairType()),
                value(body, "masterNote", entity.getMasterNote()),
                value(body, "aiDirective", entity.getAiDirective()),
                intValue(body, "sortOrder", entity.getSortOrder()),
                booleanValue(body, "active", entity.isActive())
        );
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @DeleteMapping("/{slug}")
    public Map<String, Object> deactivate(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                          @PathVariable String slug) {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        entity.update(
                entity.getTitle(),
                entity.getDescription(),
                entity.getHairType(),
                entity.getMasterNote(),
                entity.getAiDirective(),
                entity.getSortOrder(),
                false
        );
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @PostMapping("/{slug}/image")
    public Map<String, Object> image(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                     @PathVariable String slug,
                                     @RequestParam MultipartFile image) throws Exception {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        String path = "catalog/hairstyles/" + slug + extension(image);
        storage.put(path, image.getInputStream());
        entity.setImagePath(path);
        repo.save(entity);
        return Map.of("item", map(entity));
    }

    @GetMapping("/{slug}/image")
    public ResponseEntity<Resource> image(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                          @PathVariable String slug) throws Exception {
        AdminSupport.requireAdminKey(key, admin);
        var entity = repo.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        if (!storage.exists(entity.getImagePath())) throw new IllegalArgumentException("IMAGE_NOT_FOUND");
        Path path = storage.resolveLocalFile(entity.getImagePath());
        return ResponseEntity.ok().contentType(HairstyleController.mediaType(path)).body(new FileSystemResource(path));
    }

    private Map<String, Object> map(HairstyleCatalogEntity style) {
        return Map.ofEntries(
                Map.entry("id", style.getSlug()),
                Map.entry("title", style.getTitle()),
                Map.entry("description", style.getDescription()),
                Map.entry("type", style.getHairType()),
                Map.entry("masterNote", style.getMasterNote()),
                Map.entry("aiDirective", style.getAiDirective()),
                Map.entry("imagePath", style.getImagePath()),
                Map.entry("imageUrl", "/api/v1/hairstyles/" + style.getSlug() + "/image?v=" + style.getUpdatedAt().toEpochMilli()),
                Map.entry("adminImageUrl", "/api/v1/admin/hairstyles/" + style.getSlug() + "/image?v=" + style.getUpdatedAt().toEpochMilli()),
                Map.entry("sortOrder", style.getSortOrder()),
                Map.entry("active", style.isActive())
        );
    }

    static String extension(MultipartFile image) {
        if (image.isEmpty() || image.getSize() > 10 * 1024 * 1024) throw new IllegalArgumentException("IMAGE_INVALID");
        String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        if (contentType.equals("image/webp")) return ".webp";
        if (contentType.equals("image/png")) return ".png";
        if (contentType.equals("image/jpeg") || contentType.equals("image/jpg")) return ".jpg";
        throw new IllegalArgumentException("IMAGE_INVALID");
    }

    static String requireSlug(String value) {
        String slug = value == null ? "" : value.trim();
        if (!slug.matches("[a-z0-9_-]{2,80}")) throw new IllegalArgumentException("CATALOG_SLUG_INVALID");
        return slug;
    }

    static String value(Map<String, String> body, String key, String fallback) {
        String value = body.get(key);
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    static int intValue(Map<String, String> body, String key, int fallback) {
        String value = body.get(key);
        return value == null || value.isBlank() ? fallback : Integer.parseInt(value);
    }

    static boolean booleanValue(Map<String, String> body, String key, boolean fallback) {
        String value = body.get(key);
        return value == null || value.isBlank() ? fallback : Boolean.parseBoolean(value);
    }
}
