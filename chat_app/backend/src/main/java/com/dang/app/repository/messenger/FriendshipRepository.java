package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Friendship;
import com.dang.app.utils.enums.FriendshipStatus;
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



}
