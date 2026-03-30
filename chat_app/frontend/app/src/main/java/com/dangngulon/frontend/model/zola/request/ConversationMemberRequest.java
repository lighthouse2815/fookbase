package com.dangngulon.frontend.model.zola.request;

import com.dangngulon.frontend.utils.enums.MemberRole;

public class ConversationMemberRequest {
    private String userId;
    private MemberRole role;

    public ConversationMemberRequest() {
    }

    public ConversationMemberRequest(String userId, MemberRole role) {
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
