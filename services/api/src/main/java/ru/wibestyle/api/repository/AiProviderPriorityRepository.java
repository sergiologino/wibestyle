package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AiProviderPriorityEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiProviderPriorityRepository extends JpaRepository<AiProviderPriorityEntity, UUID> {

    List<AiProviderPriorityEntity> findByOperationOrderByPriorityOrderAsc(String operation);

    List<AiProviderPriorityEntity> findByOperationAndEnabledTrueOrderByPriorityOrderAsc(String operation);

    Optional<AiProviderPriorityEntity> findByOperationAndNetworkName(String operation, String networkName);
}
