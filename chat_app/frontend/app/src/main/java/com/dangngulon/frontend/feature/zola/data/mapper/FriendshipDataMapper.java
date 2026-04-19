package com.dangngulon.frontend.feature.zola.data.mapper;

import com.dangngulon.frontend.feature.zola.data.remote.dto.request.FriendshipRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.FriendshipResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.FriendshipCommand;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class FriendshipDataMapper {

    private FriendshipDataMapper() {
    }

    public static FriendshipRequest toRequest(FriendshipCommand command) {
        if (command == null) {
            return null;
        }
        return new FriendshipRequest(command.getUserId());
    }

    public static Friendship toDomain(FriendshipResponse response) {
        if (response == null) {
            return null;
        }

        return new Friendship(
                response.getFriendshipId(),
                response.getUserId(),
                response.getUsername(),
                response.getStatus(),
                response.getCreatedAt(),
                response.getUpdatedAt()
        );
    }

    public static PendingFriendRequester toDomain(PendingFriendRequesterResponse response) {
        if (response == null) {
            return null;
        }

        return new PendingFriendRequester(
                response.getUserId(),
                response.getDisplayName(),
                response.getAvatarUrl(),
                response.isRequester(),
                response.getCreatedAt()
        );
    }

    public static List<PendingFriendRequester> toDomainList(List<PendingFriendRequesterResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(FriendshipDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
