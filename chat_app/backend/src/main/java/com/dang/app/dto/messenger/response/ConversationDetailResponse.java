package com.dang.app.dto.messenger.response;

import com.dang.app.entity.messenger.Conversation;
import com.dang.app.utils.enums.ConversationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ConversationDetailResponse {

    private UUID conversationId;
    private String name;
    private ConversationType type;

    private List<ConversationMemberResponse> members;
}
