package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.service.HairstyleCatalog;
import ru.wibestyle.api.service.HairstyleTryOnService;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AuthSupport;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/hairstyles")
public class HairstyleController {
    private final HairstyleTryOnService service; private final BlobStorage storage; private final HairstyleCatalogRepository catalog;
    public HairstyleController(HairstyleTryOnService service, BlobStorage storage, HairstyleCatalogRepository catalog) { this.service = service; this.storage = storage; this.catalog=catalog; }
    @GetMapping("/catalog") public Map<String, Object> catalog() { return Map.of("items", catalog.findByActiveTrueOrderBySortOrderAsc().stream().map(s -> Map.of("id",s.getSlug(),"title",s.getTitle(),"description",s.getDescription(),"type",s.getHairType(),"masterNote",s.getMasterNote(),"imageUrl","/api/v1/hairstyles/"+s.getSlug()+"/image")).toList()); }
    @GetMapping("/{slug}/image") public ResponseEntity<Resource> image(@PathVariable String slug) throws Exception {
        var style = catalog.findBySlug(slug).filter(s -> s.isActive()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!storage.exists(style.getImagePath())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Path path = storage.resolveLocalFile(style.getImagePath());
        return ResponseEntity.ok()
                .contentType(mediaType(path))
                .body(new FileSystemResource(path));
    }
    @PostMapping(value = "/try-on", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> tryOn(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestParam(value = "portrait", required = false) MultipartFile portrait, @RequestParam String styleId) throws Exception { return service.generate(user(authorization), portrait, styleId); }
    @GetMapping("/results/{resultId}/after-photo")
    public ResponseEntity<Resource> result(@RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable UUID resultId) throws Exception {
        UUID userId = user(authorization); String key = BlobKeys.hairstyleResult(userId, resultId);
        if (!storage.exists(key)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        Path path = storage.resolveLocalFile(key); String contentType = Files.probeContentType(path);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=hairstyle.jpg").contentType(contentType == null ? MediaType.IMAGE_JPEG : MediaType.parseMediaType(contentType)).body(new FileSystemResource(path));
    }
    private UUID user(String header) { try { return AuthSupport.requireUserId(header); } catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", e); } }

    private static MediaType mediaType(Path path) throws Exception {
        String contentType = Files.probeContentType(path);
        if (contentType != null && !contentType.isBlank()) {
            return MediaType.parseMediaType(contentType);
        }
        String fileName = path.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        if (fileName.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        return MediaType.IMAGE_JPEG;
    }
}
