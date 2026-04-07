package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserProfilePresenceResponse {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private boolean isOnline;
    private LocalDateTime lastSeenAt;
}
