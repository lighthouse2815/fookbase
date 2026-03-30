package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.FriendshipResponse;
import com.dang.app.dto.messenger.response.PendingFriendRequesterResponse;
import com.dang.app.entity.messenger.Friendship;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class FriendshipMapper {

    public FriendshipResponse toResponse(
            Friendship friendship,
            UUID currentUserId,
            String displayName
    ) {
        UUID otherUserId =
                friendship.getRequester().getId().equals(currentUserId)
                        ? friendship.getAddressee().getId()
                        : friendship.getRequester().getId();

        return FriendshipResponse.builder()
                .friendShipId(friendship.getId())
                .userId(otherUserId)
                .username(displayName)
                .status(friendship.getStatus())
                .createdAt(friendship.getCreatedAt())
                .updateAt(friendship.getUpdatedAt())
                .build();
    }

    public PendingFriendRequesterResponse toPendingFriendRequesterResponse(
            UUID userId,
            String displayName,
            String avatarUrl,
            boolean isRequester,
            LocalDateTime createdAt
    ) {
        return PendingFriendRequesterResponse.builder()
                .userId(userId)
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .isRequester(isRequester)
                .createdAt(createdAt)
                .build();
    }
}
