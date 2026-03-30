package com.dang.app.repository.projection.messenger;

import java.time.LocalDateTime;
import java.util.UUID;

public interface RecentUserChatInfoProjection {
    UUID getUserId();

    String getDisplayName();

    String getAvatarUrl();

    LocalDateTime getLastMessageAt();
}
