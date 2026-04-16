package com.dang.app.dto.messenger.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BlockedUserResponse {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private LocalDateTime blockedAt;
}
