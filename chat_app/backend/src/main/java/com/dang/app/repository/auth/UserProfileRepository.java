package com.dang.app.repository.auth;

import com.dang.app.entity.auth.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    List<UserProfile> findByUser_IdIn(List<UUID> userIds);

    Optional<UserProfile> findByUser_Id(UUID userId);

    @Query("""
            SELECT p
            FROM UserProfile p
            JOIN FETCH p.user u
            WHERE u.id = :userId
              AND p.deletedAt IS NULL
            """)
    Optional<UserProfile> findPublicByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT p
            FROM UserProfile p
            JOIN FETCH p.user u
            WHERE u.id IN :userIds
              AND p.deletedAt IS NULL
              AND u.deletedAt IS NULL
              AND u.status = com.dang.app.utils.enums.Status.ACTIVE
            """)
    List<UserProfile> findPublicProfilesByUserIds(@Param("userIds") List<UUID> userIds);

    Optional<UserProfile> findByEmail(String email);

    Optional<UserProfile> findByEmailIgnoreCase(String email);

    Optional<UserProfile> findByPhoneNumber(String phoneNumber);

    @Query("""
            SELECT p
            FROM UserProfile p
            JOIN FETCH p.user u
            WHERE lower(p.email) = lower(:email)
            """)
    Optional<UserProfile> findByEmailIgnoreCaseWithUser(@Param("email") String email);

    @Query("""
            SELECT p
            FROM UserProfile p
            JOIN FETCH p.user u
            WHERE p.phoneNumber = :phoneNumber
            """)
    Optional<UserProfile> findByPhoneNumberWithUser(@Param("phoneNumber") String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCaseAndUser_IdNot(String email, UUID userId);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndUser_IdNot(String phoneNumber, UUID userId);

    @Query("""
        SELECT p.user.id, p.displayName
        FROM UserProfile p
        WHERE p.user.id IN :userIds
    """)
    List<Object[]> findDisplayNamesByUserIds(Set<UUID> userIds);

    @Query("""
            SELECT p
            FROM UserProfile p
            JOIN FETCH p.user u
            WHERE p.deletedAt IS NULL
              AND u.deletedAt IS NULL
              AND (
                    lower(coalesce(u.username, '')) LIKE lower(concat('%', :keyword, '%'))
                    OR lower(coalesce(p.email, '')) LIKE lower(concat('%', :keyword, '%'))
                    OR coalesce(p.phoneNumber, '') LIKE concat('%', :keyword, '%')
                    OR lower(coalesce(p.displayName, '')) LIKE lower(concat('%', :keyword, '%'))
                  )
            ORDER BY p.updatedAt DESC
            """)
    List<UserProfile> searchForAdmin(@Param("keyword") String keyword, Pageable pageable);

    List<UserProfile> findByDeletedAtIsNullAndUser_DeletedAtIsNullOrderByUpdatedAtDesc(Pageable pageable);

}
