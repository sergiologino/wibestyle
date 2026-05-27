package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ReviewEntity;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<ReviewEntity, UUID> {
    List<ReviewEntity> findByStatusOrderByPublishedAtDesc(String status);
}
