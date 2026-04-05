package com.dang.app.utils.mapper;

import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.dto.auth.response.UserProfileOverviewResponse;
import com.dang.app.dto.auth.response.UserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSearchResponse;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.utils.enums.FriendshipStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserProfileMapper {
    public UserProfileResponse toUserProfileResponse(UUID userId, UserProfile userProfile, String nickName, FriendshipStatus status) {
        return UserProfileResponse.builder()
                .userId(userId)
                .nickname(nickName)
                .status(status)
                .avatarUrl(userProfile.getAvatarUrl())
                .displayName(userProfile.getDisplayName())
                .gender(userProfile.getGender())
                .phoneNumber(userProfile.getPhoneNumber())
                .birthDate(userProfile.getBirthDate())
                .build();
    }

    public UserProfileSearchResponse toUserProfileSearchResponse(UserProfile userProfile, FriendshipStatus status) {
        return UserProfileSearchResponse.builder()
                .userId(userProfile.getUser().getId())
                .displayName(userProfile.getDisplayName())
                .phoneNumber(userProfile.getPhoneNumber())
                .avatarUrl(userProfile.getAvatarUrl())
                .status(status)
                .build();
    }

    public UserProfileOverviewResponse toUserProfileOverviewResponse(
            UserProfile profile,
            String maskedPhone,
            String maskedEmail
    ) {
        return UserProfileOverviewResponse.builder()
                .displayName(profile.getDisplayName())
                .phoneNumber(maskedPhone)
                .email(maskedEmail)
                .birthDate(profile.getBirthDate())
                .build();
    }

    public PublicUserProfileResponse toPublicUserProfileResponse(UserProfile profile) {
        String fullName = buildFullName(profile);
        String displayName = resolveDisplayName(profile, fullName);

        return PublicUserProfileResponse.builder()
                .userId(profile.getUser().getId())
                .displayName(displayName)
                .avatarUrl(profile.getAvatarUrl())
                .build();
    }

    public UserProfileSummaryResponse toUserProfileSummary(UserProfile profile) {
        String fullName = buildFullName(profile);
        String displayName = resolveDisplayName(profile, fullName);

        return UserProfileSummaryResponse.builder()
                .userId(profile.getUser().getId())
                .displayName(displayName)
                .avatarUrl(profile.getAvatarUrl())
                .build();
    }

    private String resolveDisplayName(UserProfile profile, String fullName) {
        String displayName = normalize(profile.getDisplayName());
        if (displayName != null) {
            return displayName;
        }

        if (fullName != null) {
            return fullName;
        }

        String username = profile.getUser() == null ? null : normalize(profile.getUser().getUsername());
        if (username != null) {
            return username;
        }

        return "user";
    }

    private String buildFullName(UserProfile profile) {
        String firstName = normalize(profile.getFirstName());
        String lastName = normalize(profile.getLastName());

        if (firstName == null && lastName == null) {
            return null;
        }

        if (firstName == null) {
            return lastName;
        }

        if (lastName == null) {
            return firstName;
        }

        return (firstName + " " + lastName).trim();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

}
