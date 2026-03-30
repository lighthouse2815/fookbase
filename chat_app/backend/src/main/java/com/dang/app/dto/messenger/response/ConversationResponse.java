package com.dang.app.dto.messenger.response;

import com.dang.app.entity.messenger.Conversation;
import com.dang.app.utils.enums.ConversationType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ConversationResponse {

    private UUID conversationId;
    private String name;
    private String avatarUrl;
    private ConversationType type;

    private UUID lastSenderId;
    private String lastMessagePreview;
    private String lastSenderName;
    private LocalDateTime lastMessageAt;

    private int unreadCount;
    private boolean hasUnread;

    private int memberCount;
}

