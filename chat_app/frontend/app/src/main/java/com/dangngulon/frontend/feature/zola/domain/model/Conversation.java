package com.dangngulon.frontend.feature.zola.domain.model;

import com.dangngulon.frontend.core.utils.enums.ConversationType;

public class Conversation {
    private String conversationId;
    private String name;
    private String avatarUrl;
    private ConversationType type;
    private String lastSenderId;
    private String lastMessagePreview;
    private String lastSenderName;
    private String lastMessageAt;
    private int unreadCount;
    private boolean hasUnread;
    private int memberCount;

    public Conversation() {
    }

    public Conversation(
            String conversationId,
            String name,
            String avatarUrl,
            ConversationType type,
            String lastSenderId,
            String lastMessagePreview,
            String lastSenderName,
            String lastMessageAt,
            int unreadCount,
            boolean hasUnread,
            int memberCount
    ) {
        this.conversationId = conversationId;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.type = type;
        this.lastSenderId = lastSenderId;
        this.lastMessagePreview = lastMessagePreview;
        this.lastSenderName = lastSenderName;
        this.lastMessageAt = lastMessageAt;
        this.unreadCount = unreadCount;
        this.hasUnread = hasUnread;
        this.memberCount = memberCount;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
        this.type = type;
    }

    public String getLastSenderId() {
        return lastSenderId;
    }

    public void setLastSenderId(String lastSenderId) {
        this.lastSenderId = lastSenderId;
    }

    public String getLastMessagePreview() {
        return lastMessagePreview;
    }

    public void setLastMessagePreview(String lastMessagePreview) {
        this.lastMessagePreview = lastMessagePreview;
    }

    public String getLastSenderName() {
        return lastSenderName;
    }

    public void setLastSenderName(String lastSenderName) {
        this.lastSenderName = lastSenderName;
    }

    public String getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(String lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }

    public boolean isHasUnread() {
        return hasUnread;
    }

    public void setHasUnread(boolean hasUnread) {
        this.hasUnread = hasUnread;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(int memberCount) {
        this.memberCount = memberCount;
    }
}
