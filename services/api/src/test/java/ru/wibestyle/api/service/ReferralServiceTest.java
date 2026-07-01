package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.ReferralAccountEntity;
import ru.wibestyle.api.domain.ReferralRewardEntity;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.ReferralAccountRepository;
import ru.wibestyle.api.repository.ReferralRewardRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.repository.BillingCheckoutRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReferralServiceTest {

    @Test
    void adminReportShowsPurchaseAndReward() {
        ReferralAccountRepository accounts = mock(ReferralAccountRepository.class);
        ReferralRewardRepository rewards = mock(ReferralRewardRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        BillingCheckoutRepository checkouts = mock(BillingCheckoutRepository.class);
        ReferralService service = new ReferralService(
                accounts, rewards, profiles, users, mock(NotificationService.class), checkouts);

        UUID senderId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();
        UUID checkoutId = UUID.randomUUID();
        Instant now = Instant.now();
        ReferralAccountEntity senderAccount = new ReferralAccountEntity(senderId, "VIBEREPORT12", now);
        ReferralAccountEntity friendAccount = new ReferralAccountEntity(friendId, "VIBEFRIEND12", now);
        friendAccount.setReferredByUserId(senderId);
        friendAccount.setReferredAt(now);
        BillingCheckoutEntity checkout = new BillingCheckoutEntity(
                checkoutId, friendId, "elite", "annual", 9990, "mock", now);
        checkout.setStatus("completed");
        checkout.setCompletedAt(now);
        ReferralRewardEntity reward = new ReferralRewardEntity(
                UUID.randomUUID(), senderId, friendId, checkoutId, "annual", 15, "Друг", now);

        when(accounts.findAllByReferredByUserIdIsNotNullOrderByReferredAtDesc()).thenReturn(List.of(friendAccount));
        when(accounts.findById(senderId)).thenReturn(Optional.of(senderAccount));
        when(users.findById(senderId)).thenReturn(Optional.of(new UserEntity(senderId, "+79990000001", now)));
        when(users.findById(friendId)).thenReturn(Optional.of(new UserEntity(friendId, "+79990000002", now)));
        when(checkouts.findFirstByUserIdAndCheckoutTypeAndStatusOrderByCompletedAtAsc(friendId, "initial", "completed"))
                .thenReturn(Optional.of(checkout));
        when(rewards.findByReferredUserId(friendId)).thenReturn(Optional.of(reward));

        Map<String, Object> report = service.adminOverview();
        Map<?, ?> summary = (Map<?, ?>) report.get("summary");
        assertEquals(1L, summary.get("purchases"));
        assertEquals(1L, summary.get("rewarded"));
        assertEquals(15, summary.get("generationsAwarded"));
    }

    @Test
    void awardsThreeForMonthlyFirstPurchase() {
        assertReward("monthly", 3);
    }

    @Test
    void awardsFifteenForAnnualFirstPurchase() {
        assertReward("annual", 15);
    }

    @Test
    void overviewAllowsTrialUserToShare() {
        ReferralAccountRepository accounts = mock(ReferralAccountRepository.class);
        ReferralRewardRepository rewards = mock(ReferralRewardRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        profile.setPlan("trial");
        when(accounts.findById(userId))
                .thenReturn(Optional.of(new ReferralAccountEntity(userId, "VIBETRIAL123", Instant.now())));
        when(profiles.findById(userId)).thenReturn(Optional.of(profile));
        when(rewards.findAllByReferrerUserIdOrderByRewardedAtDesc(userId)).thenReturn(List.of());
        ReferralService service = new ReferralService(
                accounts, rewards, profiles, mock(UserRepository.class),
                mock(NotificationService.class), mock(BillingCheckoutRepository.class));

        assertTrue((Boolean) service.overview(userId).get("eligible"));
    }

    private void assertReward(String period, int expected) {
        ReferralAccountRepository accounts = mock(ReferralAccountRepository.class);
        ReferralRewardRepository rewards = mock(ReferralRewardRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        ReferralService service = new ReferralService(
                accounts, rewards, profiles, users, notifications, mock(BillingCheckoutRepository.class));

        UUID referrerId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();
        UUID checkoutId = UUID.randomUUID();
        ReferralAccountEntity friendAccount = new ReferralAccountEntity(friendId, "VIBETEST1234", Instant.now());
        friendAccount.setReferredByUserId(referrerId);
        UserProfileEntity referrer = new UserProfileEntity(referrerId, Instant.now());
        referrer.setPlan("trial");
        BillingCheckoutEntity checkout = new BillingCheckoutEntity(
                checkoutId, friendId, "wibe", period, 1000, "mock", Instant.now()
        );

        when(rewards.existsByReferredUserId(friendId)).thenReturn(false);
        when(accounts.findById(friendId)).thenReturn(Optional.of(friendAccount));
        when(profiles.findById(referrerId)).thenReturn(Optional.of(referrer));
        when(users.findById(friendId)).thenReturn(Optional.of(new UserEntity(friendId, "+79990001234", Instant.now())));

        service.rewardFirstPurchase(checkout);

        assertEquals(expected, referrer.getBonusGenerationsLeft());
        verify(rewards).save(any(ReferralRewardEntity.class));
        verify(notifications).create(
                org.mockito.ArgumentMatchers.eq(referrerId),
                org.mockito.ArgumentMatchers.eq("referral_reward"),
                any(), any(), any(), any()
        );
    }
}
