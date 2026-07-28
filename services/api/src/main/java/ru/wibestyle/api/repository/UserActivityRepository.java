package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.wibestyle.api.domain.UserActivityEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface UserActivityRepository extends JpaRepository<UserActivityEntity, UUID> {

    @Query(value = """
            SELECT u.id
            FROM users u
            JOIN push_devices pd ON pd.user_id = u.id AND pd.enabled = TRUE
            LEFT JOIN user_activity ua ON ua.user_id = u.id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE u.created_at <= :registeredBefore
              AND COALESCE(ua.last_seen_at, u.created_at) <= :inactiveBefore
              AND COALESCE(ua.last_try_on_at, :epoch) <= :inactiveBefore
              AND (up.user_id IS NULL OR up.plan <> 'trial' OR (up.trial_generations_left + up.bonus_generations_left) > 0)
              AND NOT EXISTS (
                  SELECT 1 FROM user_notifications n
                  WHERE n.user_id = u.id
                    AND n.notification_type = 'reactivation_try_on'
                    AND n.created_at >= :recentNotificationAfter
              )
            GROUP BY u.id
            ORDER BY MIN(COALESCE(ua.last_seen_at, u.created_at)) ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<UUID> findReactivationCandidates(
            @Param("registeredBefore") Instant registeredBefore,
            @Param("inactiveBefore") Instant inactiveBefore,
            @Param("recentNotificationAfter") Instant recentNotificationAfter,
            @Param("epoch") Instant epoch,
            @Param("limit") int limit
    );
}
