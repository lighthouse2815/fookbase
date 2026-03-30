package com.dang.app.repository.messenger;

import com.dang.app.entity.messenger.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, UUID> {

    @Query("""
        SELECT COUNT(ms)
        FROM MessageStatus ms
        WHERE ms.user.id = :userId
          AND ms.message.conversation.id = :conversationId
          AND ms.status <> 'SEEN'
    """)
    int countUnread(@Param("userId") UUID userId, @Param("conversationId") UUID conversationId);

    @Query("""
        SELECT ms.message.conversation.id, COUNT(ms)
        FROM MessageStatus ms
        WHERE ms.user.id = :userId
          AND ms.status <> 'SEEN'
        GROUP BY ms.message.conversation.id
    """)
    List<Object[]> countUnreadByUser(@Param("userId") UUID userId);

}



