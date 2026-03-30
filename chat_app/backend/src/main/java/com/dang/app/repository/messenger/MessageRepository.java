package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.Message;
import com.dang.app.repository.projection.messenger.MessageProjection;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT
            m.id AS messageId,
            m.conversation.id AS conversationId,
            s.id AS senderId,
            s.username AS senderName,
            m.content AS content,
            ms.status AS status,
            m.type AS type,
            m.createdAt AS createdAtRaw
        FROM Message m
        JOIN m.sender s
        LEFT JOIN MessageStatus ms
            ON ms.message = m
           AND ms.user.id = :viewerId
           AND ms.deletedAt IS NULL
        WHERE m.conversation.id = :conversationId
          AND m.deletedAt IS NULL
          AND (
                :cursorCreatedAt IS NULL
                OR m.createdAt < :cursorCreatedAt
                OR (m.createdAt = :cursorCreatedAt AND m.id < :cursorMessageId)
          )
        ORDER BY m.createdAt DESC, m.id DESC
    """)
    List<MessageProjection> findMessageProjectionsByConversationId(
            @Param("conversationId") UUID conversationId,
            @Param("viewerId") UUID viewerId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorMessageId") UUID cursorMessageId,
            Pageable pageable
    );

    default List<MessageProjection> findMessageProjectionsByConversationId(
            UUID conversationId,
            UUID viewerId,
            LocalDateTime cursorCreatedAt,
            UUID cursorMessageId,
            int limit
    ) {
        return findMessageProjectionsByConversationId(
                conversationId,
                viewerId,
                cursorCreatedAt,
                cursorMessageId,
                PageRequest.of(0, limit)
        );
    }
}
