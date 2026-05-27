package ru.wibestyle.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.LandingLeadEntity;
import ru.wibestyle.api.dto.CreateLeadRequest;
import ru.wibestyle.api.repository.LandingLeadRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class LeadService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("new", "contacted", "converted", "rejected");

    private final LandingLeadRepository landingLeadRepository;
    private final int annualRub;
    private final int discountedAnnualRub;
    private final int firstUsersLimit;

    public LeadService(
            LandingLeadRepository landingLeadRepository,
            @Value("${wibestyle.billing.annual-rub:6990}") int annualRub,
            @Value("${wibestyle.billing.discounted-annual-rub:3495}") int discountedAnnualRub,
            @Value("${wibestyle.billing.first-users-limit:100}") int firstUsersLimit
    ) {
        this.landingLeadRepository = landingLeadRepository;
        this.annualRub = annualRub;
        this.discountedAnnualRub = discountedAnnualRub;
        this.firstUsersLimit = firstUsersLimit;
    }

    public LandingLeadEntity register(CreateLeadRequest request) {
        long count = landingLeadRepository.count();
        int spotNumber = (int) count + 1;
        boolean hasDiscount = spotNumber <= firstUsersLimit;

        LandingLeadEntity entity = new LandingLeadEntity(
                UUID.randomUUID(),
                spotNumber,
                hasDiscount,
                annualRub,
                hasDiscount ? discountedAnnualRub : annualRub,
                request.name(),
                request.phoneOrEmail().trim(),
                request.gender(),
                request.favoriteMarketplace(),
                request.interest(),
                request.consent(),
                request.page(),
                request.utmSource(),
                request.utmCampaign(),
                request.referrer(),
                Instant.now()
        );

        return landingLeadRepository.save(entity);
    }

    public int remainingDiscountSpots() {
        long count = landingLeadRepository.count();
        return Math.max(0, firstUsersLimit - (int) count);
    }

    public Map<String, Object> publicStats() {
        return Map.of("remainingSpots", remainingDiscountSpots());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listForAdmin(String status) {
        List<LandingLeadEntity> leads = status == null || status.isBlank()
                ? landingLeadRepository.findAllByOrderByCreatedAtDesc()
                : landingLeadRepository.findByStatusOrderByCreatedAtDesc(status.trim());
        List<Map<String, Object>> items = leads.stream().map(this::toLeadMap).toList();
        return Map.of("items", items, "remainingSpots", remainingDiscountSpots());
    }

    @Transactional
    public Map<String, Object> updateStatus(UUID leadId, String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("LEAD_STATUS_INVALID");
        }
        LandingLeadEntity lead = landingLeadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("LEAD_NOT_FOUND"));
        lead.setStatus(status);
        landingLeadRepository.save(lead);
        return Map.of("lead", toLeadMap(lead));
    }

    @Transactional(readOnly = true)
    public String exportCsv(String status) {
        List<LandingLeadEntity> leads = status == null || status.isBlank()
                ? landingLeadRepository.findAllByOrderByCreatedAtDesc()
                : landingLeadRepository.findByStatusOrderByCreatedAtDesc(status.trim());

        StringBuilder csv = new StringBuilder();
        csv.append("id,spotNumber,status,name,phoneOrEmail,gender,favoriteMarketplace,interest,hasDiscount,priceAnnual,priceWithDiscount,page,utmSource,utmCampaign,referrer,createdAt\n");
        for (LandingLeadEntity lead : leads) {
            csv.append(csvValue(lead.getId().toString())).append(',');
            csv.append(lead.getSpotNumber()).append(',');
            csv.append(csvValue(lead.getStatus())).append(',');
            csv.append(csvValue(lead.getName())).append(',');
            csv.append(csvValue(lead.getPhoneOrEmail())).append(',');
            csv.append(csvValue(lead.getGender())).append(',');
            csv.append(csvValue(lead.getFavoriteMarketplace())).append(',');
            csv.append(csvValue(lead.getInterest())).append(',');
            csv.append(lead.isHasDiscount()).append(',');
            csv.append(lead.getPriceAnnual()).append(',');
            csv.append(lead.getPriceWithDiscount()).append(',');
            csv.append(csvValue(lead.getPage())).append(',');
            csv.append(csvValue(lead.getUtmSource())).append(',');
            csv.append(csvValue(lead.getUtmCampaign())).append(',');
            csv.append(csvValue(lead.getReferrer())).append(',');
            csv.append(csvValue(lead.getCreatedAt().toString())).append('\n');
        }
        return csv.toString();
    }

    public Map<String, Object> toLeadMap(LandingLeadEntity lead) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", lead.getId().toString());
        map.put("spotNumber", lead.getSpotNumber());
        map.put("hasDiscount", lead.isHasDiscount());
        map.put("priceAnnual", lead.getPriceAnnual());
        map.put("priceWithDiscount", lead.getPriceWithDiscount());
        map.put("name", lead.getName());
        map.put("phoneOrEmail", lead.getPhoneOrEmail());
        map.put("gender", lead.getGender());
        map.put("favoriteMarketplace", lead.getFavoriteMarketplace());
        map.put("interest", lead.getInterest());
        map.put("consent", lead.isConsent());
        map.put("status", lead.getStatus());
        map.put("page", lead.getPage());
        map.put("utmSource", lead.getUtmSource());
        map.put("utmCampaign", lead.getUtmCampaign());
        map.put("referrer", lead.getReferrer());
        map.put("createdAt", lead.getCreatedAt().toString());
        return map;
    }

    private static String csvValue(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
