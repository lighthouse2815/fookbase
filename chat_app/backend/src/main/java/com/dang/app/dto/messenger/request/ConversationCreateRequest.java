package com.dang.app.dto.messenger.request;

import com.dang.app.entity.messenger.Conversation;
import com.dang.app.utils.enums.ConversationType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;


@Data
public class ConversationCreateRequest {

    @NotNull
    private ConversationType type;

    private String name;

    @NotEmpty
    @Valid
    private List<ConversationMemberRequest> members;
}

