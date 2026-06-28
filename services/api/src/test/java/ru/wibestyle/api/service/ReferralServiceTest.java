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

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReferralServiceTest {

    @Test
    void awardsThreeForMonthlyFirstPurchase() {
        assertReward("monthly", 3);
    }

    @Test
    void awardsFifteenForAnnualFirstPurchase() {
        assertReward("annual", 15);
    }

    private void assertReward(String period, int expected) {
        ReferralAccountRepository accounts = mock(ReferralAccountRepository.class);
        ReferralRewardRepository rewards = mock(ReferralRewardRepository.class);
        UserProfileRepository profiles = mock(UserProfileRepository.class);
        UserRepository users = mock(UserRepository.class);
        NotificationService notifications = mock(NotificationService.class);
        ReferralService service = new ReferralService(accounts, rewards, profiles, users, notifications);

        UUID referrerId = UUID.randomUUID();
        UUID friendId = UUID.randomUUID();
        UUID checkoutId = UUID.randomUUID();
        ReferralAccountEntity friendAccount = new ReferralAccountEntity(friendId, "VIBETEST1234", Instant.now());
        friendAccount.setReferredByUserId(referrerId);
        UserProfileEntity referrer = new UserProfileEntity(referrerId, Instant.now());
        referrer.setPlan("wibe");
        referrer.setSubscriptionExpiresAt(Instant.now().plusSeconds(3600));
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
