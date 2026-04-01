package com.dang.app.dto.messenger.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendSuggestionResponse {
    private UUID id;
    private String displayName;
    private String avatarUrl;
    private int mutualFriends;
}
