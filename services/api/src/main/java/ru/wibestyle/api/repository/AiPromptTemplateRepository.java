package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AiPromptTemplateEntity;

public interface AiPromptTemplateRepository extends JpaRepository<AiPromptTemplateEntity, String> {
}
