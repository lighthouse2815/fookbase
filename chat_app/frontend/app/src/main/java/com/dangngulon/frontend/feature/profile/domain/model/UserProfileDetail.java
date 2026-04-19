package com.dangngulon.frontend.feature.profile.domain.model;

public class UserProfileDetail {
    private final String userId;
    private final String displayName;
    private final String avatarUrl;
    private final String phoneNumber;
    private final String gender;
    private final String birthDate;
    private final boolean isFriend;
    private final String nickname;

    public UserProfileDetail(
            String userId,
            String displayName,
            String avatarUrl,
            String phoneNumber,
            String gender,
            String birthDate,
            boolean isFriend,
            String nickname
    ) {
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.phoneNumber = phoneNumber;
        this.gender = gender;
        this.birthDate = birthDate;
        this.isFriend = isFriend;
        this.nickname = nickname;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getGender() {
        return gender;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public boolean isFriend() {
        return isFriend;
    }

    public String getNickname() {
        return nickname;
    }
}
