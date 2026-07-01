package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AiProviderErrorMappingEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiProviderErrorMappingRepository extends JpaRepository<AiProviderErrorMappingEntity, UUID> {

    List<AiProviderErrorMappingEntity> findAllByOrderByCreatedAtAsc();

    List<AiProviderErrorMappingEntity> findByEnabledTrueOrderByCreatedAtAsc();

    Optional<AiProviderErrorMappingEntity> findByErrorTextIgnoreCase(String errorText);
}
