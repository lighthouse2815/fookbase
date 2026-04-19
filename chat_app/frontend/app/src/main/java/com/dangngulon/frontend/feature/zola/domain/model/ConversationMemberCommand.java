package com.dangngulon.frontend.feature.zola.domain.model;

import com.dangngulon.frontend.core.utils.enums.MemberRole;

public class ConversationMemberCommand {
    private String userId;
    private MemberRole role;

    public ConversationMemberCommand() {
    }

    public ConversationMemberCommand(String userId, MemberRole role) {
        this.userId = userId;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public MemberRole getRole() {
        return role;
    }

    public void setRole(MemberRole role) {
        this.role = role;
    }
}
