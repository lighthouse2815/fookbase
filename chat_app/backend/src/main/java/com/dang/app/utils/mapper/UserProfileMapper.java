package com.dang.app.utils.mapper;

import com.dang.app.dto.auth.request.UpdateProfileInfoVisibilityRequest;
import com.dang.app.dto.auth.response.ProfileInfoSettingsResponse;
import com.dang.app.dto.auth.response.ProfileInfoVisibilityResponse;
import com.dang.app.dto.auth.response.PublicUserProfileResponse;
import com.dang.app.dto.auth.response.UserProfilePresenceResponse;
import com.dang.app.dto.auth.response.UserProfileSummaryResponse;
import com.dang.app.dto.auth.response.UserProfileOverviewResponse;
import com.dang.app.dto.auth.response.UserProfileResponse;
import com.dang.app.dto.auth.response.UserProfileSearchResponse;
import com.dang.app.dto.auth.response.UserSecurityPrivateResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfileInfoVisibility;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.utils.enums.FriendshipStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class UserProfileMapper {
    public UserProfileResponse toUserProfileResponse(
            UUID userId,
            UserProfile userProfile,
            String nickName,
            FriendshipStatus status
    ) {
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
            String maskedUsername,
            String maskedPhone,
            String maskedEmail
    ) {
        return UserProfileOverviewResponse.builder()
                .userId(profile.getUser().getId())
                .username(maskedUsername)
                .displayName(profile.getDisplayName())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .phoneNumber(maskedPhone)
                .email(maskedEmail)
                .avatarUrl(profile.getAvatarUrl())
                .birthDate(profile.getBirthDate())
                .gender(profile.getGender() == null ? null : profile.getGender().name())
                .build();
    }

    public UserSecurityPrivateResponse toUserSecurityPrivateResponse(
            User user,
            UserProfile profile
    ) {
        return UserSecurityPrivateResponse.builder()
                .username(user == null ? null : normalize(user.getUsername()))
                .email(normalize(profile.getEmail()))
                .phoneNumber(normalize(profile.getPhoneNumber()))
                .build();
    }

    public ProfileInfoSettingsResponse toProfileInfoSettingsResponse(
            UserProfile profile,
            long friendCount
    ) {
        return ProfileInfoSettingsResponse.builder()
                .displayName(normalize(profile.getDisplayName()))
                .phoneNumber(normalize(profile.getPhoneNumber()))
                .email(normalize(profile.getEmail()))
                .dateOfBirth(profile.getBirthDate())
                .gender(profile.getGender() == null ? null : profile.getGender().name())
                .friendCount(Math.max(friendCount, 0))
                .build();
    }

    public ProfileInfoVisibilityResponse toProfileInfoVisibilityResponse(UserProfileInfoVisibility visibility) {
        return ProfileInfoVisibilityResponse.builder()
                .displayNameVisible(resolveVisibility(visibility.getDisplayNameVisible()))
                .phoneVisible(resolveVisibility(visibility.getPhoneVisible()))
                .emailVisible(resolveVisibility(visibility.getEmailVisible()))
                .dateOfBirthVisible(resolveVisibility(visibility.getDateOfBirthVisible()))
                .genderVisible(resolveVisibility(visibility.getGenderVisible()))
                .friendCountVisible(resolveVisibility(visibility.getFriendCountVisible()))
                .build();
    }

    public void applyProfileInfoVisibility(
            UserProfileInfoVisibility visibility,
            UpdateProfileInfoVisibilityRequest request
    ) {
        visibility.setDisplayNameVisible(request.getDisplayNameVisible());
        visibility.setPhoneVisible(request.getPhoneVisible());
        visibility.setEmailVisible(request.getEmailVisible());
        visibility.setDateOfBirthVisible(request.getDateOfBirthVisible());
        visibility.setGenderVisible(request.getGenderVisible());
        visibility.setFriendCountVisible(request.getFriendCountVisible());
    }

    public PublicUserProfileResponse toPublicUserProfileResponse(
            UUID userId,
            UserProfile userProfile,
            String nickName,
            FriendshipStatus status,
            long friendsCount
    ) {
        return PublicUserProfileResponse.builder()
                .userId(userId)
                .nickname(nickName)
                .status(status)
                .friendsCount(friendsCount)
                .avatarUrl(userProfile.getAvatarUrl())
                .displayName(userProfile.getDisplayName())
                .gender(userProfile.getGender())
                .phoneNumber(userProfile.getPhoneNumber())
                .birthDate(userProfile.getBirthDate())
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

    public UserProfilePresenceResponse toUserProfilePresenceResponse(
            UserProfile profile,
            boolean isOnline,
            LocalDateTime lastSeenAt
    ) {
        UserProfileSummaryResponse summary = toUserProfileSummary(profile);

        return UserProfilePresenceResponse.builder()
                .userId(summary.getUserId())
                .displayName(summary.getDisplayName())
                .avatarUrl(summary.getAvatarUrl())
                .isOnline(isOnline)
                .lastSeenAt(isOnline ? null : lastSeenAt)
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

    private boolean resolveVisibility(Boolean value) {
        return value == null || value;
    }

}
