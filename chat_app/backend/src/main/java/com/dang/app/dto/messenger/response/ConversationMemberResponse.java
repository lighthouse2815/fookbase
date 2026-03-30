package com.dang.app.dto.messenger.response;

import com.dang.app.utils.enums.MemberRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversationMemberResponse {
    private UUID userId;
    private MemberRole role;
    private UUID lastReadMessageId;
    private LocalDateTime joinedAt;
    private boolean outGroup;
}
