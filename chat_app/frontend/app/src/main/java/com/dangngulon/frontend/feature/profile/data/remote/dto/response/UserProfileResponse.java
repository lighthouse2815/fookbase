package com.dangngulon.frontend.feature.profile.data.remote.dto.response;

import com.google.gson.annotations.SerializedName;

public class UserProfileResponse {

    private String userId;
    private String displayName;
    private String avatarUrl;
    private String phoneNumber;
    private String gender;
    private String birthDate;

    @SerializedName(value = "isFriend", alternate = {"friend"})
    private boolean isFriend;

    private String nickname;

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