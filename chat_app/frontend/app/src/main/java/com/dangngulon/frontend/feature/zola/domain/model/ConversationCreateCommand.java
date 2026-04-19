package com.dangngulon.frontend.feature.zola.domain.model;

import com.dangngulon.frontend.core.utils.enums.ConversationType;

import java.util.List;

public class ConversationCreateCommand {
    private ConversationType type;
    private String name;
    private String createdBy;
    private List<ConversationMemberCommand> members;

    public ConversationCreateCommand() {
    }

    public ConversationCreateCommand(
            ConversationType type,
            String name,
            String createdBy,
            List<ConversationMemberCommand> members
    ) {
        this.type = type;
        this.name = name;
        this.createdBy = createdBy;
        this.members = members;
    }

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
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

    public List<ConversationMemberCommand> getMembers() {
        return members;
    }

    public void setMembers(List<ConversationMemberCommand> members) {
        this.members = members;
    }
}
