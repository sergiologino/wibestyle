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
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AuthSupport;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/hairstyles")
public class HairstyleController {
    private final HairstyleTryOnService service; private final BlobStorage storage;
    public HairstyleController(HairstyleTryOnService service, BlobStorage storage) { this.service = service; this.storage = storage; }
    @GetMapping("/catalog") public Map<String, Object> catalog() { return Map.of("items", HairstyleCatalog.STYLES); }
    @PostMapping(value = "/try-on", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> tryOn(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestParam("portrait") MultipartFile portrait, @RequestParam String styleId) throws Exception { return service.generate(user(authorization), portrait, styleId); }
    @GetMapping("/results/{resultId}/after-photo")
    public ResponseEntity<Resource> result(@RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable UUID resultId) throws Exception {
        UUID userId = user(authorization); String key = BlobKeys.hairstyleResult(userId, resultId);
        if (!storage.exists(key)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        Path path = storage.resolveLocalFile(key); String contentType = Files.probeContentType(path);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=hairstyle.jpg").contentType(contentType == null ? MediaType.IMAGE_JPEG : MediaType.parseMediaType(contentType)).body(new FileSystemResource(path));
    }
    private UUID user(String header) { try { return AuthSupport.requireUserId(header); } catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", e); } }
}
