package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.wibestyle.api.domain.UserEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByPhone(String phone);

    @Query("""
            select user from UserEntity user
            where user.phone = :phoneWithPlus
               or user.phone = :digits
               or user.phone like concat('%', :digits)
            order by case
                when user.phone = :phoneWithPlus then 0
                when user.phone = :digits then 1
                else 2
            end, user.createdAt desc
            """)
    List<UserEntity> findPhoneLoginCandidates(
            @Param("phoneWithPlus") String phoneWithPlus,
            @Param("digits") String digits,
            Pageable pageable
    );

    Optional<UserEntity> findByLoginIgnoreCase(String login);

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    @Query(
            value = """
                    select user from UserEntity user
                    left join UserProfileEntity profile on profile.userId = user.id
                    where :query is null
                       or :query = ''
                       or lower(coalesce(user.phone, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(user.email, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(user.login, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(profile.displayName, '')) like lower(concat('%', :query, '%'))
                       or lower(cast(user.id as string)) like lower(concat('%', :query, '%'))
                    order by user.createdAt desc
                    """,
            countQuery = """
                    select count(user) from UserEntity user
                    left join UserProfileEntity profile on profile.userId = user.id
                    where :query is null
                       or :query = ''
                       or lower(coalesce(user.phone, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(user.email, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(user.login, '')) like lower(concat('%', :query, '%'))
                       or lower(coalesce(profile.displayName, '')) like lower(concat('%', :query, '%'))
                       or lower(cast(user.id as string)) like lower(concat('%', :query, '%'))
                    """
    )
    Page<UserEntity> searchAdminUsers(@Param("query") String query, Pageable pageable);
}
