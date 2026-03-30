package com.dang.app.repository.messenger;

import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.ConversationMember;
import com.dang.app.repository.projection.messenger.RecentUserChatInfoProjection;
import com.dang.app.utils.enums.ConversationType;
import com.dang.app.utils.enums.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    Optional<ConversationMember> findByConversation_IdAndUser_Id(UUID conversationId, UUID userId);

    Optional<ConversationMember> findByConversation_IdAndUser_IdAndLeftAtIsNull(UUID conversationId, UUID userId);

    long countByConversation_IdAndLeftAtIsNull(UUID conversationId);

    long countByConversation_IdAndLeftAtIsNullAndRole(UUID conversationId, MemberRole role);

    @Query("""
        SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END
        FROM ConversationMember cm
        WHERE cm.conversation.id = :conversationId
          AND cm.user.id = :userId
          AND cm.leftAt IS NULL
          AND cm.conversation.deletedAt IS NULL
    """)
    boolean existsActiveMember(
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId
    );

    @Query("""
        SELECT cm.user
        FROM ConversationMember cm
        WHERE cm.conversation.id = :conversationId
          AND cm.user.id <> :excludedUserId
          AND cm.leftAt IS NULL
          AND cm.conversation.deletedAt IS NULL
    """)
    List<User> findActiveUsersByConversationIdExcludingUserId(
            @Param("conversationId") UUID conversationId,
            @Param("excludedUserId") UUID excludedUserId
    );

    @Query("""
        SELECT cm.conversation.id, cm.user.id
        FROM ConversationMember cm
        WHERE cm.conversation.id IN :conversationIds
          AND cm.user.id <> :currentUserId
          AND cm.leftAt IS NULL
          AND cm.conversation.type = :type
    """)
    List<Object[]> findOtherUserIdsInConversations(
            @Param("conversationIds") Set<UUID> conversationIds,
            @Param("currentUserId") UUID currentUserId,
            @Param("type") ConversationType type
    );

    @Query("""
        SELECT DISTINCT
            cmOther.user.id AS userId,
            profile.displayName AS displayName,
            profile.avatarUrl AS avatarUrl,
            c.lastMessageAt AS lastMessageAt
        FROM ConversationMember cmSelf
        JOIN cmSelf.conversation c
        JOIN c.members cmOther,
             UserProfile profile
        WHERE cmSelf.user.id = :userId
          AND cmSelf.leftAt IS NULL
          AND cmOther.user.id <> :userId
          AND cmOther.leftAt IS NULL
          AND profile.user.id = cmOther.user.id
          AND c.type = :type
          AND c.deletedAt IS NULL
        ORDER BY c.lastMessageAt DESC, c.createdAt DESC
    """)
    List<RecentUserChatInfoProjection> findMemberInfoByUserIdAndConversationType(
            @Param("userId") UUID userId,
            @Param("type") ConversationType type
    );




}
