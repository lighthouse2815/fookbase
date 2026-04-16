package com.dang.app.utils.mapper;

import com.dang.app.dto.messenger.response.FriendshipResponse;
import com.dang.app.dto.messenger.response.FriendSuggestionResponse;
import com.dang.app.dto.messenger.response.BlockedUserResponse;
import com.dang.app.dto.messenger.response.PendingFriendRequesterResponse;
import com.dang.app.entity.messenger.Friendship;
import com.dang.app.repository.projection.messenger.FriendSuggestionProjection;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
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

    public BlockedUserResponse toBlockedUserResponse(
            UUID userId,
            String displayName,
            String avatarUrl,
            LocalDateTime blockedAt
    ) {
        return BlockedUserResponse.builder()
                .userId(userId)
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .blockedAt(blockedAt)
                .build();
    }

    public FriendSuggestionResponse toFriendSuggestionResponse(FriendSuggestionProjection projection) {
        long mutualFriends = projection.getMutualFriends() == null ? 0L : projection.getMutualFriends();

        return FriendSuggestionResponse.builder()
                .id(toUuid(projection.getId()))
                .displayName(projection.getDisplayName())
                .avatarUrl(projection.getAvatarUrl())
                .mutualFriends(Math.toIntExact(mutualFriends))
                .build();
    }

    private UUID toUuid(byte[] bytes) {
        if (bytes == null || bytes.length != 16) {
            throw new IllegalStateException("Invalid UUID binary length for friend suggestion");
        }

        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        return new UUID(buffer.getLong(), buffer.getLong());
    }
}
