package ru.wibestyle.api.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import java.util.UUID;

@Service
public class SizeComplimentService {

    private static final Logger log = LoggerFactory.getLogger(SizeComplimentService.class);

    private final NoteappAiClient noteappAiClient;
    private final AiIntegrationProperties aiProperties;

    public SizeComplimentService(NoteappAiClient noteappAiClient, AiIntegrationProperties aiProperties) {
        this.noteappAiClient = noteappAiClient;
        this.aiProperties = aiProperties;
    }

    public String buildSuggestion(
            UUID sessionId,
            GarmentFitAnalyzer.GarmentFitAssessment assessment,
            AvatarSnapshotEntity snapshot
    ) {
        if (!assessment.suggestAlternateSize() || assessment.recommendedSize() == null) {
            return null;
        }
        String ai = tryAiCompliment(sessionId, assessment, snapshot);
        if (ai != null && !ai.isBlank()) {
            return ai.trim();
        }
        return templateCompliment(sessionId, assessment, snapshot);
    }

    private String tryAiCompliment(
            UUID sessionId,
            GarmentFitAnalyzer.GarmentFitAssessment assessment,
            AvatarSnapshotEntity snapshot
    ) {
        String network = aiProperties.getSizeComplimentNetwork();
        if (network == null || network.isBlank() || !aiProperties.isNoteappConfigured()) {
            return null;
        }
        String system = """
                Ты стилист WibeStyle. Напиши ОДНО короткое предложение по-русски (до 140 символов).
                Предложи примерить другой размер вещи — тепло, с лёгким комплиментом фигуре, без стереотипов и без повторяющихся штампов.
                Не используй кавычки. Не пиши «размер S» в лоб — вплети размер естественно.
                """;
        String user = """
                session=%s
                выбранный размер на карточке: %s
                рекомендуемый размер: %s
                статус посадки: %s
                рост %s см, грудь %s см, талия %s см, бёдра %s см, привычный размер одежды: %s
                """.formatted(
                sessionId,
                assessment.selectedSize(),
                assessment.recommendedSize(),
                assessment.status(),
                nullSafe(snapshot.getHeightCm()),
                nullSafe(snapshot.getBustCm()),
                nullSafe(snapshot.getWaistCm()),
                nullSafe(snapshot.getHipsCm()),
                snapshot.getClothingSize() == null ? "не указан" : snapshot.getClothingSize()
        );
        try {
            return noteappAiClient.generateChatText(network, system, user);
        } catch (Exception ex) {
            log.warn("Size compliment AI failed, using template: {}", ex.getMessage());
            return null;
        }
    }

    private static String templateCompliment(
            UUID sessionId,
            GarmentFitAnalyzer.GarmentFitAssessment assessment,
            AvatarSnapshotEntity snapshot
    ) {
        String selected = assessment.selectedSize();
        String recommended = assessment.recommendedSize();
        String clothing = snapshot.getClothingSize() == null ? "" : snapshot.getClothingSize().trim();
        int variant = Math.floorMod(sessionId.hashCode(), 6);
        return switch (variant) {
            case 0 -> "Ваша фигура слишком роскошна для размера %s — давайте попробуем %s, размер императрицы ✦"
                    .formatted(selected, recommended);
            case 1 -> "Размер %s на вашу пышность явно скромничает — %s подчеркнёт силуэт без компромиссов"
                    .formatted(selected, recommended);
            case 2 -> "По меркам вашей %s-й грации %s тесноват — смело берите %s"
                    .formatted(clothing.isBlank() ? "фигуры" : clothing, selected, recommended);
            case 3 -> "Этот %s словно эскиз — а вы заслуживаете полотно формата %s"
                    .formatted(selected, recommended);
            case 4 -> "Грудь и бёдра говорят «нам нужен %s», а не %s — доверимся им?"
                    .formatted(recommended, selected);
            default -> "Вещь %s на ваших объёмах сидит как перчатка на статуе — %s будет честнее и красивее"
                    .formatted(selected, recommended);
        };
    }

    private static String nullSafe(Integer value) {
        return value == null ? "—" : value.toString();
    }
}
