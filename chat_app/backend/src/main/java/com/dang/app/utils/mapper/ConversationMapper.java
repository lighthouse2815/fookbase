package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.RecentUserChatResponse;
import com.dang.app.dto.messenger.response.ConversationResponse;
import com.dang.app.entity.messenger.Conversation;
import com.dang.app.entity.messenger.ConversationMember;
import com.dang.app.repository.projection.messenger.RecentUserChatInfoProjection;
import com.dang.app.utils.enums.ConversationType;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ConversationMapper {

    public ConversationResponse toResponse(
            Conversation conversation,
            Map<UUID, Integer> unreadMap,
            Map<UUID, UUID> otherUserMap,
            Map<UUID, String> displayNameMap) {
        return toResponse(conversation, unreadMap, otherUserMap, displayNameMap, null);
    }

    public ConversationResponse toResponse(
            Conversation conversation,
            Map<UUID, Integer> unreadMap,
            Map<UUID, UUID> otherUserMap,
            Map<UUID, String> displayNameMap,
            Map<UUID, String> avatarMap) {
        Map<UUID, Integer> safeUnreadMap = unreadMap == null ? Collections.emptyMap() : unreadMap;
        Map<UUID, UUID> safeOtherUserMap = otherUserMap == null ? Collections.emptyMap() : otherUserMap;
        Map<UUID, String> safeDisplayNameMap = displayNameMap == null ? Collections.emptyMap() : displayNameMap;
        Map<UUID, String> safeAvatarMap = avatarMap == null ? Collections.emptyMap() : avatarMap;

        LocalDateTime timestamp =
                conversation.getLastMessageAt() != null
                        ? conversation.getLastMessageAt()
                        : conversation.getCreatedAt();

        int unreadCount = safeUnreadMap.getOrDefault(conversation.getId(), 0);
        UUID lastSenderId = conversation.getLastSenderId();

        String name;
        String avatarUrl = conversation.getAvatarUrl();
        if (conversation.getType() == ConversationType.GROUP) {
            name = conversation.getName() == null ? "" : conversation.getName();
        } else {
            UUID otherUserId = safeOtherUserMap.get(conversation.getId());
            name = otherUserId == null
                    ? ""
                    : safeDisplayNameMap.getOrDefault(otherUserId, "");
            if (otherUserId != null) {
                avatarUrl = safeAvatarMap.getOrDefault(otherUserId, avatarUrl);
            }
        }

        String lastSenderName =
                lastSenderId == null
                        ? ""
                        : safeDisplayNameMap.getOrDefault(lastSenderId, "");
        String lastMessagePreview =
                conversation.getLastMessagePreview() == null
                        ? ""
                        : conversation.getLastMessagePreview();

        List<ConversationMember> members =
                conversation.getMembers() == null ? Collections.emptyList() : conversation.getMembers();
        int memberCount = (int) members.stream()
                .filter(member -> member.getLeftAt() == null)
                .count();

        return ConversationResponse.builder()
                .conversationId(conversation.getId())
                .name(name)
                .avatarUrl(avatarUrl)
                .type(conversation.getType())
                .unreadCount(unreadCount)
                .hasUnread(unreadCount > 0)
                .lastMessageAt(timestamp)
                .lastSenderName(lastSenderName)
                .lastSenderId(lastSenderId)
                .lastMessagePreview(lastMessagePreview)
                .memberCount(memberCount)
                .build();
    }

    public List<RecentUserChatResponse> toRecentUserChatResponses(List<RecentUserChatInfoProjection> projections) {
        if (projections == null || projections.isEmpty()) {
            return List.of();
        }

        return projections.stream()
                .map(this::toRecentUserChatResponse)
                .toList();
    }

    public RecentUserChatResponse toRecentUserChatResponse(RecentUserChatInfoProjection projection) {
        if (projection == null) {
            return RecentUserChatResponse.builder().build();
        }

        return RecentUserChatResponse.builder()
                .userId(projection.getUserId() == null ? null : projection.getUserId().toString())
                .username(projection.getDisplayName())
                .avatar(projection.getAvatarUrl())
                .lastChatTime(projection.getLastMessageAt())
                .build();
    }

}
