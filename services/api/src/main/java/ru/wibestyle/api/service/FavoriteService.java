package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.FavoriteEntity;
import ru.wibestyle.api.dto.CreateFavoriteRequest;
import ru.wibestyle.api.repository.FavoriteRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ObjectMapper objectMapper;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            ObjectMapper objectMapper
    ) {
        this.favoriteRepository = favoriteRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(UUID userId) {
        List<FavoriteEntity> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return Map.of("items", favorites.stream().map(this::toMap).toList());
    }

    @Transactional
    public Map<String, Object> add(UUID userId, CreateFavoriteRequest request) {
        FavoriteEntity favorite = favoriteRepository
                .findByUserIdAndMarketplaceAndExternalProductId(userId, request.marketplace(), request.externalProductId())
                .orElseGet(() -> new FavoriteEntity(
                        UUID.randomUUID(),
                        userId,
                        request.marketplace(),
                        request.externalProductId(),
                        Instant.now()
                ));

        favorite.setProductTitle(request.title());
        favorite.setProductBrand(request.brand());
        favorite.setProductPriceRub(request.priceRub());
        favorite.setProductImageUrl(request.imageUrl());
        favorite.setProductUrl(request.productUrl());
        favorite.setTryOnSessionId(request.tryOnSessionId());
        favorite.setProductSizes(serializeSizes(request.sizes()));
        favorite.setNote(request.note());
        favorite.setTags(request.tags());

        favoriteRepository.save(favorite);
        return Map.of("favorite", toMap(favorite));
    }

    @Transactional
    public Map<String, Object> remove(UUID userId, String marketplace, String externalProductId) {
        favoriteRepository.findByUserIdAndMarketplaceAndExternalProductId(userId, marketplace, externalProductId)
                .ifPresent(favoriteRepository::delete);
        return Map.of("removed", true);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(UUID userId, String marketplace, String externalProductId) {
        return favoriteRepository.findByUserIdAndMarketplaceAndExternalProductId(userId, marketplace, externalProductId).isPresent();
    }

    private Map<String, Object> toMap(FavoriteEntity favorite) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", favorite.getId().toString());
        map.put("marketplace", favorite.getMarketplace());
        map.put("externalProductId", favorite.getExternalProductId());
        map.put("title", favorite.getProductTitle());
        map.put("brand", favorite.getProductBrand());
        map.put("priceRub", favorite.getProductPriceRub());
        map.put("imageUrl", favorite.getProductImageUrl());
        map.put("productUrl", favorite.getProductUrl());
        map.put("tryOnSessionId", favorite.getTryOnSessionId() == null ? null : favorite.getTryOnSessionId().toString());
        map.put("sizes", deserializeSizes(favorite.getProductSizes()));
        map.put("note", favorite.getNote());
        map.put("tags", favorite.getTags());
        map.put("createdAt", favorite.getCreatedAt().toString());
        return map;
    }

    private String serializeSizes(List<String> sizes) {
        if (sizes == null) return "[]";
        try {
            return objectMapper.writeValueAsString(sizes);
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }

    private List<String> deserializeSizes(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        try {
            return objectMapper.readValue(raw, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }
}
