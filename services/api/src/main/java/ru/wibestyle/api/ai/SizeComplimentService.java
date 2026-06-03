package ru.wibestyle.api.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.service.AiPromptTemplateService;

import java.util.UUID;

@Service
public class SizeComplimentService {

    private static final Logger log = LoggerFactory.getLogger(SizeComplimentService.class);

    private final NoteappAiClient noteappAiClient;
    private final AiIntegrationProperties aiProperties;
    private final AiPromptTemplateService promptTemplateService;

    public SizeComplimentService(
            NoteappAiClient noteappAiClient,
            AiIntegrationProperties aiProperties,
            AiPromptTemplateService promptTemplateService
    ) {
        this.noteappAiClient = noteappAiClient;
        this.aiProperties = aiProperties;
        this.promptTemplateService = promptTemplateService;
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
        if (network == null || network.isBlank() || !aiProperties.isChatNetworkConfigured()) {
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

    public String buildResultCompliment(
            TryOnSessionEntity session,
            GarmentFitAnalyzer.GarmentFitAssessment assessment,
            AvatarSnapshotEntity snapshot,
            String plan
    ) {
        boolean freePlan = plan == null || plan.isBlank() || "trial".equalsIgnoreCase(plan);
        boolean shareHint = Math.floorMod(session.getId().hashCode(), 4) == 0;
        String ai = tryAiResultCompliment(session, assessment, snapshot, freePlan, shareHint);
        if (ai != null && !ai.isBlank()) {
            return trimForStorage(ai);
        }
        return templateResultCompliment(session, freePlan, shareHint);
    }

    private String tryAiResultCompliment(
            TryOnSessionEntity session,
            GarmentFitAnalyzer.GarmentFitAssessment assessment,
            AvatarSnapshotEntity snapshot,
            boolean freePlan,
            boolean shareHint
    ) {
        String network = aiProperties.getSizeComplimentNetwork();
        if (network == null || network.isBlank() || !aiProperties.isChatNetworkConfigured()) {
            return null;
        }
        String system = promptTemplateService.getBodyOrDefault(
                AiPromptTemplateService.TRYON_RESULT_COMPLIMENT_RU_KEY,
                """
                        Ты fashion-стилист WibeStyle. Напиши один короткий комплимент на русском для экрана результата примерки (до 150 символов).
                        Тон: тёплый, современный, без фамильярности и стереотипов. Если shareHint=true — предложи поделиться образом с подругой.
                        Если freePlan=true — мягко предложи закрепить стиль подпиской. Без кавычек, без emoji.
                        """
        );
        String user = """
                session=%s
                товар=%s
                бренд=%s
                выбранный размер=%s
                статус посадки=%s
                рекомендуемый размер=%s
                freePlan=%s
                shareHint=%s
                рост %s см, грудь %s см, талия %s см, бёдра %s см, привычный размер: %s
                """.formatted(
                session.getId(),
                safe(session.getProductTitle(), "образ"),
                safe(session.getProductBrand(), "не указан"),
                safe(assessment.selectedSize(), "не указан"),
                safe(assessment.status(), "ok"),
                safe(assessment.recommendedSize(), "не нужен"),
                freePlan,
                shareHint,
                nullSafe(snapshot.getHeightCm()),
                nullSafe(snapshot.getBustCm()),
                nullSafe(snapshot.getWaistCm()),
                nullSafe(snapshot.getHipsCm()),
                snapshot.getClothingSize() == null ? "не указан" : snapshot.getClothingSize()
        );
        try {
            return noteappAiClient.generateChatText(network, system, user);
        } catch (Exception ex) {
            log.warn("Result compliment AI failed, using template: {}", ex.getMessage());
            return null;
        }
    }

    private static String templateResultCompliment(TryOnSessionEntity session, boolean freePlan, boolean shareHint) {
        String title = safe(session.getProductTitle(), "образ");
        int variant = Math.floorMod(session.getId().hashCode(), 5);
        String base = switch (variant) {
            case 0 -> "Этот %s смотрится собранно и очень в вашем ритме".formatted(title);
            case 1 -> "Образ получился лёгким, цельным и с тем самым эффектом «хочу повторить»";
            case 2 -> "%s добавляет силуэту аккуратный fashion-акцент".formatted(title);
            case 3 -> "Очень удачный look: чистые линии, заметный акцент и без лишнего шума";
            default -> "Смотрится свежо и уверенно — такой образ легко представить в реальной жизни";
        };
        if (shareHint) {
            return trimForStorage(base + ". Можно отправить подруге и быстро сверить впечатление.");
        }
        if (freePlan) {
            return trimForStorage(base + ". Закрепите стиль подпиской, чтобы сохранять лучшие примерки.");
        }
        return trimForStorage(base + ".");
    }

    private static String trimForStorage(String value) {
        String cleaned = value == null ? "" : value.trim().replaceAll("[\\r\\n]+", " ");
        if (cleaned.length() <= 500) {
            return cleaned;
        }
        return cleaned.substring(0, 500).trim();
    }

    private static String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String nullSafe(Integer value) {
        return value == null ? "—" : value.toString();
    }
}
