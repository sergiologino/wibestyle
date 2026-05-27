package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.LandingInterestEntity;

import java.util.UUID;

public interface LandingInterestRepository extends JpaRepository<LandingInterestEntity, UUID> {
}
