package com.dangngulon.frontend.feature.zola.data.mapper;

import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendProfileResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AddFriendSearchResponse;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendProfile;
import com.dangngulon.frontend.feature.zola.domain.model.AddFriendSearchProfile;

public final class AddFriendProfileDataMapper {

    private AddFriendProfileDataMapper() {
    }

    public static AddFriendProfile toDomain(AddFriendProfileResponse response) {
        if (response == null) {
            return null;
        }

        return new AddFriendProfile(
                response.getUserId(),
                response.getDisplayName(),
                response.getAvatarUrl(),
                response.getPhoneNumber()
        );
    }

    public static AddFriendSearchProfile toDomain(AddFriendSearchResponse response) {
        if (response == null) {
            return null;
        }

        return new AddFriendSearchProfile(
                response.getUserId(),
                response.getDisplayName(),
                response.getPhoneNumber(),
                response.getAvatarUrl(),
                response.getStatus()
        );
    }
}
