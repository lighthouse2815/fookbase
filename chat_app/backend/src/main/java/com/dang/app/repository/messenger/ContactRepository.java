package com.dang.app.repository.messenger;

import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.Contact;
import com.dang.app.repository.projection.messenger.ContactTargetInfoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {

    @Query("""
            SELECT
                c.id AS contactId,
                c.target.id AS userId,
                c.nickname AS nickname,
                p.avatarUrl AS avatar,
                CASE
                    WHEN c.phoneVisible = true THEN p.phoneNumber
                    ELSE NULL
                END AS phoneNumber
            FROM Contact c
            LEFT JOIN UserProfile p ON p.user.id = c.target.id
            WHERE c.owner.id = :ownerId
              AND c.deletedAt IS NULL
            ORDER BY c.createdAt DESC
            """)
    List<ContactTargetInfoProjection> findContactTargetInfosByOwnerId(@Param("ownerId") UUID ownerId);

    boolean existsByOwnerAndTargetOrOwnerAndTarget(
            User owner1, User target1,
            User owner2, User target2
    );

    Optional<Contact> findByOwnerAndTarget(User owner, User target);

    @Query("""
            SELECT c
            FROM Contact c
            JOIN FETCH c.target t
            JOIN FETCH UserProfile p ON p.user = t
            WHERE c.owner.id = :ownerId
              AND c.blocked = false
            """)
    List<Contact> findFriendsWithProfile(UUID ownerId);

    Optional<Contact> findByOwner_IdAndTarget_Id(UUID ownerId, UUID targetId);

    @Query("""
            SELECT c.nickname
            FROM Contact c
            WHERE c.owner.id = :ownerId
              AND c.target.id = :targetId
              AND c.deletedAt IS NULL
            """)
    Optional<String> findNicknameByOwnerIdAndTargetId(
            @Param("ownerId") UUID ownerId,
            @Param("targetId") UUID targetId
    );

}

