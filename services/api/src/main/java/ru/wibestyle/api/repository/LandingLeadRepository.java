package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.LandingLeadEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LandingLeadRepository extends JpaRepository<LandingLeadEntity, UUID> {
    long count();

    List<LandingLeadEntity> findByStatusOrderByCreatedAtDesc(String status);

    List<LandingLeadEntity> findAllByOrderByCreatedAtDesc();
}
