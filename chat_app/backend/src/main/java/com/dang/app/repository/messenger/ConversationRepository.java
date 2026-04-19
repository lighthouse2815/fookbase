package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Conversation;
import com.dang.app.utils.enums.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByIdAndDeletedAtIsNull(UUID id);

    @Query("""
        SELECT DISTINCT c
        FROM Conversation c
        JOIN c.members cmSelf
        LEFT JOIN FETCH c.members cmAll
        WHERE cmSelf.user.id = :userId
          AND cmSelf.leftAt IS NULL
          AND c.deletedAt IS NULL
    """)
    List<Conversation> findVisibleByUserId(@Param("userId") UUID userId);

    @Query("""
        SELECT DISTINCT c
        FROM Conversation c
        JOIN c.members cmSelf
        LEFT JOIN FETCH c.members cmAll
        WHERE cmSelf.user.id = :userId
          AND cmSelf.leftAt IS NULL
          AND c.type = :type
          AND c.deletedAt IS NULL
    """)
    List<Conversation> findVisibleByUserIdAndType(
            @Param("userId") UUID userId,
            @Param("type") ConversationType type
    );




}
