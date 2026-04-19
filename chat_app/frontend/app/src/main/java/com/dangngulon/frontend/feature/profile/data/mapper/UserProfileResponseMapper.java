package com.dangngulon.frontend.feature.profile.data.mapper;

import com.dangngulon.frontend.core.utils.AvatarDefaults;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileDetail;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileSearchResult;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileResponse;
import com.dangngulon.frontend.feature.profile.data.remote.dto.response.UserProfileSearchResponse;

public final class UserProfileResponseMapper {

    private UserProfileResponseMapper() {
    }

    public static UserProfileOverview toOverview(UserProfileOverviewResponse response) {
        if (response == null) {
            return new UserProfileOverview(null, null, null, null);
        }

        return new UserProfileOverview(
                response.getDisplayName(),
                response.getPhoneNumber(),
                response.getEmail(),
                response.getBirthDate()
        );
    }

    public static UserProfileDetail toDetail(UserProfileResponse response) {
        if (response == null) {
            return new UserProfileDetail(null, null, null, null, null, null, false, null);
        }

        return new UserProfileDetail(
                response.getUserId(),
                response.getDisplayName(),
                AvatarDefaults.resolve(response.getAvatarUrl()),
                response.getPhoneNumber(),
                response.getGender(),
                response.getBirthDate(),
                response.isFriend(),
                response.getNickname()
        );
    }

    public static UserProfileSearchResult toSearchResult(UserProfileSearchResponse response) {
        if (response == null) {
            return new UserProfileSearchResult(null, null, null, null, null);
        }

        return new UserProfileSearchResult(
                response.getUserId(),
                response.getDisplayName(),
                response.getPhoneNumber(),
                AvatarDefaults.resolve(response.getAvatarUrl()),
                response.getStatus()
        );
    }
}
