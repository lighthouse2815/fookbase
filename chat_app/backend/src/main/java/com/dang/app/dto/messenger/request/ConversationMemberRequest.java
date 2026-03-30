package com.dang.app.dto.messenger.request;

import com.dang.app.entity.messenger.ConversationMember;
import com.dang.app.utils.enums.MemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ConversationMemberRequest {

    @NotNull
    private UUID userId;

    @NotNull
    private MemberRole role;
}
