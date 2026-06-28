package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.ReferralAccountEntity;
import ru.wibestyle.api.domain.ReferralRewardEntity;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.ReferralAccountRepository;
import ru.wibestyle.api.repository.ReferralRewardRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReferralService {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();
    private final ReferralAccountRepository accountRepository;
    private final ReferralRewardRepository rewardRepository;
    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReferralService(ReferralAccountRepository accountRepository, ReferralRewardRepository rewardRepository,
                           UserProfileRepository profileRepository, UserRepository userRepository,
                           NotificationService notificationService) {
        this.accountRepository = accountRepository;
        this.rewardRepository = rewardRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void captureNewUser(UUID userId, String referralCode) {
        if (referralCode == null || referralCode.isBlank()) return;
        ReferralAccountEntity referrer = accountRepository.findByReferralCodeIgnoreCase(referralCode.trim()).orElse(null);
        if (referrer == null || referrer.getUserId().equals(userId)) return;
        ReferralAccountEntity account = ensureAccount(userId);
        if (account.getReferredByUserId() == null) {
            account.setReferredByUserId(referrer.getUserId());
            account.setReferredAt(Instant.now());
            accountRepository.save(account);
        }
    }

    @Transactional
    public void rewardFirstPurchase(BillingCheckoutEntity checkout) {
        if ("renewal".equals(checkout.getCheckoutType()) || rewardRepository.existsByReferredUserId(checkout.getUserId())) return;
        ReferralAccountEntity invitee = accountRepository.findById(checkout.getUserId()).orElse(null);
        if (invitee == null || invitee.getReferredByUserId() == null || invitee.getFirstPaidAt() != null) return;
        invitee.setFirstPaidAt(Instant.now());
        accountRepository.save(invitee);
        UserProfileEntity referrer = profileRepository.findById(invitee.getReferredByUserId()).orElse(null);
        if (!isActiveSubscriber(referrer)) return;

        int reward = "annual".equals(checkout.getBillingPeriod()) ? 15 : 3;
        referrer.setBonusGenerationsLeft(referrer.getBonusGenerationsLeft() + reward);
        referrer.setUpdatedAt(Instant.now());
        profileRepository.save(referrer);

        UserEntity friend = userRepository.findById(checkout.getUserId()).orElseThrow();
        rewardRepository.save(new ReferralRewardEntity(
                UUID.randomUUID(), referrer.getUserId(), checkout.getUserId(), checkout.getId(),
                checkout.getBillingPeriod(), reward, friendLabel(friend), Instant.now()
        ));
        notificationService.create(referrer.getUserId(), "referral_reward",
                "Начислены реферальные примерки",
                friendLabel(friend) + " оформил подписку. Вам начислено " + reward + " дополнительных примерок.",
                "/referrals", "referral-reward:" + checkout.getUserId());
    }

    @Transactional
    public Map<String, Object> overview(UUID userId) {
        ReferralAccountEntity account = ensureAccount(userId);
        UserProfileEntity profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        List<Map<String, Object>> rewards = rewardRepository.findAllByReferrerUserIdOrderByRewardedAtDesc(userId)
                .stream().map(item -> Map.<String, Object>of(
                        "id", item.getId().toString(),
                        "friend", item.getFriendLabel(),
                        "billingPeriod", item.getBillingPeriod(),
                        "generations", item.getRewardGenerations(),
                        "rewardedAt", item.getRewardedAt().toString()
                )).toList();
        return Map.of(
                "eligible", isActiveSubscriber(profile),
                "referralCode", account.getReferralCode(),
                "bonusGenerationsLeft", profile.getBonusGenerationsLeft(),
                "monthlyReward", 3,
                "annualReward", 15,
                "rewards", rewards
        );
    }

    private ReferralAccountEntity ensureAccount(UUID userId) {
        return accountRepository.findById(userId).orElseGet(() ->
                accountRepository.save(new ReferralAccountEntity(userId, generateUniqueCode(), Instant.now())));
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder value = new StringBuilder("VIBE");
            for (int i = 0; i < 8; i++) value.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            code = value.toString();
        } while (accountRepository.existsByReferralCodeIgnoreCase(code));
        return code;
    }

    private boolean isActiveSubscriber(UserProfileEntity profile) {
        return profile != null
                && ("wibe".equals(profile.getPlan()) || "elite".equals(profile.getPlan()))
                && profile.getSubscriptionExpiresAt() != null
                && profile.getSubscriptionExpiresAt().isAfter(Instant.now());
    }

    private String friendLabel(UserEntity user) {
        if (user.getPhone() != null && user.getPhone().length() >= 4) {
            return "Друг с номером ••••" + user.getPhone().substring(user.getPhone().length() - 4);
        }
        if (user.getEmail() != null) {
            int at = user.getEmail().indexOf('@');
            return at > 0 ? user.getEmail().substring(0, 1) + "•••" + user.getEmail().substring(at) : "Приглашённый друг";
        }
        return "Приглашённый друг";
    }
}
