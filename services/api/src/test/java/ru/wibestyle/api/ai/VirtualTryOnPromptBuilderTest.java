package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.service.AiPromptTemplateService;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VirtualTryOnPromptBuilderTest {

    @Mock
    private AvatarSnapshotRepository avatarSnapshotRepository;

    @Mock
    private GarmentFitAnalyzer garmentFitAnalyzer;

    @Mock
    private AiPromptTemplateService promptTemplateService;

    private VirtualTryOnPromptBuilder promptBuilder;

    @BeforeEach
    void setUp() {
        when(promptTemplateService.getBodyOrDefault(eq(AiPromptTemplateService.VTON_BASE_RU_KEY), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("Base prompt from admin.");

        promptBuilder = new VirtualTryOnPromptBuilder(
                avatarSnapshotRepository,
                garmentFitAnalyzer,
                new ObjectMapper(),
                promptTemplateService
        );
    }

    @Test
    void includesBaseJsonVariablesProfileAndFitHint() {
        UUID snapshotId = UUID.randomUUID();
        TryOnSessionEntity session = session(snapshotId);
        AvatarSnapshotEntity snapshot = snapshot(snapshotId);
        when(avatarSnapshotRepository.findById(snapshotId)).thenReturn(Optional.of(snapshot));
        when(garmentFitAnalyzer.analyze(eq(session), eq(snapshot), org.mockito.ArgumentMatchers.any())).thenReturn(
                GarmentFitAnalyzer.GarmentFitAssessment.tooSmall(
                        "S",
                        "XL",
                        3,
                        "Size S is too tight; preserve the body."
                )
        );

        String prompt = promptBuilder.buildPrompt(session);

        assertThat(prompt).startsWith("FACE AND IDENTITY LOCK");
        assertThat(prompt).contains("Base prompt from admin.");
        assertThat(prompt).contains("TRY-ON VARIABLES (JSON");
        assertThat(prompt).contains("\"faceLock\"");
        assertThat(prompt).contains("PROMPT PROFILE: dress");
        assertThat(prompt).contains("Never duplicate the seller model");
        assertThat(prompt).contains("\"marketplaceLabelSize\" : \"M\"");
        assertThat(prompt).contains("\"promptProfile\" : \"dress\"");
        assertThat(prompt).contains("\"productPhotoHasHumanModel\" : true");
        assertThat(prompt).contains("\"sellerModelPolicy\"");
        assertThat(prompt).contains("Size S is too tight");
        assertThat(prompt).contains("Summer dress");
    }

    private static TryOnSessionEntity session(UUID snapshotId) {
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                snapshotId,
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                Instant.now(),
                Instant.now()
        );
        session.setProductTitle("Summer dress");
        session.setProductBrand("Brand");
        session.setSelectedSize("M");
        session.setGarmentCategory("dress");
        session.setGarmentPromptProfile("dress");
        session.setGarmentCoverageLevel("normal");
        session.setGarmentModerationRisk("low");
        session.setGarmentHasHumanModel(true);
        return session;
    }

    private static AvatarSnapshotEntity snapshot(UUID snapshotId) {
        return new AvatarSnapshotEntity(
                snapshotId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                168,
                92,
                68,
                98,
                38,
                "50",
                "/tmp/avatar.jpg",
                false,
                false,
                false,
                0.9,
                "v1",
                Instant.now()
        );
    }
}
