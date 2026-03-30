package com.dangngulon.frontend.model.zola.request;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.utils.enums.ConversationType;

import java.util.List;

public class ConversationCreateRequest {
    private ConversationType type;
    private String name;
    private String createdBy;
    private List<ConversationMemberRequest> members;

    public ConversationCreateRequest() {
    }

    public ConversationCreateRequest(
            @NonNull ConversationType type,
            String name, String createdBy,
            @NonNull List<ConversationMemberRequest> members
    ) {
        this.type = type;
        this.name = name;
        this.createdBy = createdBy;
        this.members = members;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType( ConversationType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @NonNull
    public List<ConversationMemberRequest> getMembers() {
        return members;
    }

    public void setMembers(List<ConversationMemberRequest> members) {
        this.members = members;
    }
}


