package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.FriendshipStatus;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserProfileSearchResponse {
    private UUID userId;
    private String displayName;
    private String phoneNumber;
    private String avatarUrl;
    private FriendshipStatus status;
}
