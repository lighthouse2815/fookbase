package com.dang.app.dto.messenger.request;

import lombok.Data;

@Data
public class ConversationUpdateRequest {
    private String name;
    private String avatarUrl;
}
