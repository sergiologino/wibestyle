package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.MarketingEventEntity;

import java.util.UUID;

public interface MarketingEventRepository extends JpaRepository<MarketingEventEntity, UUID> {
}
