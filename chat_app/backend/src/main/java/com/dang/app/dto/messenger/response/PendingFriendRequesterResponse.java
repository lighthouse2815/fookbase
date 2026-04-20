package com.dang.app.dto.messenger.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PendingFriendRequesterResponse {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private boolean isRequester;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;
}
