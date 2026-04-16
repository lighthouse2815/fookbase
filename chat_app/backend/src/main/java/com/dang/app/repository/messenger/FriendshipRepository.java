package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.projection.messenger.FriendSuggestionProjection;
import com.dang.app.utils.enums.FriendshipStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship,UUID> {

    Optional<Friendship> findByUserLowIdAndUserHighId(UUID userLowId, UUID userHighId);

    @Query("""
            SELECT f
            FROM Friendship f
            JOIN FETCH f.requester r
            JOIN FETCH f.addressee a
            WHERE (r.id = :userId OR a.id = :userId)
              AND f.status = com.dang.app.utils.enums.FriendshipStatus.PENDING
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findPendingFriendshipsByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT f
            FROM Friendship f
            JOIN FETCH f.requester r
            JOIN FETCH f.addressee a
            WHERE (r.id = :userId OR a.id = :userId)
              AND f.status = com.dang.app.utils.enums.FriendshipStatus.BLOCKED
            ORDER BY f.updatedAt DESC, f.createdAt DESC
            """)
    List<Friendship> findBlockedFriendshipsByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT f.status
            FROM Friendship f
            WHERE
             (f.requester.id = :u1 AND f.addressee.id = :u2)
             OR
             (f.requester.id = :u2 AND f.addressee.id = :u1)
        """)
    Optional<FriendshipStatus> findStatusBetween(UUID u1, UUID u2);

    @Query("""
            SELECT f
            FROM Friendship f
            WHERE
             (f.requester.id = :u1 AND f.addressee.id = :u2)
             OR
             (f.requester.id = :u2 AND f.addressee.id = :u1)
        """)
    Optional<Friendship> findBetween(UUID u1, UUID u2);

    @Query("""
            SELECT COUNT(f)
            FROM Friendship f
            WHERE f.status = com.dang.app.utils.enums.FriendshipStatus.ACCEPTED
              AND (f.userLowId = :userId OR f.userHighId = :userId)
            """)
    long countAcceptedFriendsByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT CASE
                    WHEN f.userLowId = :userId THEN f.userHighId
                    ELSE f.userLowId
                   END
            FROM Friendship f
            WHERE f.status = com.dang.app.utils.enums.FriendshipStatus.ACCEPTED
              AND (f.userLowId = :userId OR f.userHighId = :userId)
            """)
    List<UUID> findAcceptedFriendIdsByUserId(@Param("userId") UUID userId);

    @Query(value = """
            WITH
            my_friends AS (
                SELECT
                    f.user_high_id AS mutual_id
                FROM friendships f
                WHERE f.status = 'ACCEPTED'
                  AND f.user_low_id = :currentUserId
                UNION ALL
                SELECT
                    f.user_low_id AS mutual_id
                FROM friendships f
                WHERE f.status = 'ACCEPTED'
                  AND f.user_high_id = :currentUserId
            ),
            candidate_mutual AS (
                SELECT
                    f.user_high_id AS candidate_id,
                    mf.mutual_id
                FROM my_friends mf
                JOIN friendships f
                  ON f.user_low_id = mf.mutual_id
                 AND f.status = 'ACCEPTED'
                 AND f.user_high_id <> :currentUserId
                UNION ALL
                SELECT
                    f.user_low_id AS candidate_id,
                    mf.mutual_id
                FROM my_friends mf
                JOIN friendships f
                  ON f.user_high_id = mf.mutual_id
                 AND f.status = 'ACCEPTED'
                 AND f.user_low_id <> :currentUserId
            ),
            candidate_scores AS (
                SELECT
                    cm.candidate_id,
                    COUNT(DISTINCT cm.mutual_id) AS mutual_friends
                FROM candidate_mutual cm
                WHERE NOT EXISTS (
                        SELECT 1
                        FROM friendships relation
                        WHERE relation.user_low_id = :currentUserId
                          AND relation.user_high_id = cm.candidate_id
                          AND relation.status IN ('ACCEPTED', 'PENDING', 'BLOCKED')
                )
                  AND NOT EXISTS (
                        SELECT 1
                        FROM friendships relation
                        WHERE relation.user_low_id = cm.candidate_id
                          AND relation.user_high_id = :currentUserId
                          AND relation.status IN ('ACCEPTED', 'PENDING', 'BLOCKED')
                )
                GROUP BY cm.candidate_id
            )
            SELECT
                cs.candidate_id AS id,
                profile.display_name AS displayName,
                profile.avatar_url AS avatarUrl,
                cs.mutual_friends AS mutualFriends
            FROM candidate_scores cs
            JOIN users candidate
              ON candidate.id = cs.candidate_id
             AND candidate.status = 'ACTIVE'
             AND candidate.deleted_at IS NULL
            JOIN user_profiles profile
              ON profile.user_id = cs.candidate_id
             AND profile.deleted_at IS NULL
            ORDER BY cs.mutual_friends DESC, profile.display_name ASC
            """, nativeQuery = true)
    List<FriendSuggestionProjection> findFriendSuggestions(
            @Param("currentUserId") UUID currentUserId,
            Pageable pageable
    );



}
