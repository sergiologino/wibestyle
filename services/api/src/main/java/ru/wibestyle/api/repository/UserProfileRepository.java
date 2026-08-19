package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.wibestyle.api.domain.UserProfileEntity;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfileEntity, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select profile from UserProfileEntity profile where profile.userId = :userId")
    Optional<UserProfileEntity> findByIdForUpdate(@Param("userId") UUID userId);

    @Query("select profile.userId from UserProfileEntity profile")
    List<UUID> findAllUserIds();

    @Query("select profile.userId from UserProfileEntity profile where profile.plan = :plan")
    List<UUID> findUserIdsByPlan(@Param("plan") String plan);

    @Query("""
            select profile.userId
            from UserProfileEntity profile
            where profile.plan in ('wibe', 'elite')
              and (profile.subscriptionExpiresAt is null or profile.subscriptionExpiresAt > :now)
            """)
    List<UUID> findPaidUserIds(@Param("now") Instant now);

    @Modifying
    @Query("""
            update UserProfileEntity profile
            set profile.promoDiscountPercent = :discountPercent,
                profile.updatedAt = :now
            where profile.activePromoCodeId = :promoCodeId
            """)
    int updatePromoDiscountForActivePromo(
            @Param("promoCodeId") UUID promoCodeId,
            @Param("discountPercent") int discountPercent,
            @Param("now") Instant now
    );
}
