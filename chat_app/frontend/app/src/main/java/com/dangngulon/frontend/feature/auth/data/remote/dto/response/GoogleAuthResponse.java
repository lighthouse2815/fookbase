package com.dangngulon.frontend.feature.auth.data.remote.dto.response;

import com.dangngulon.frontend.core.utils.enums.Status;

public class GoogleAuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String userId;
    private String displayName;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String avatarUrl;
    private String birthDate;
    private String gender;
    private Boolean profileCompleted;
    private Status status;
    private boolean isNew;

    public GoogleAuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            String userId,
            String displayName,
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String avatarUrl,
            String birthDate,
            String gender,
            Boolean profileCompleted,
            Status status,
            boolean isNew
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.userId = userId;
        this.displayName = displayName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
        this.birthDate = birthDate;
        this.gender = gender;
        this.profileCompleted = profileCompleted;
        this.status = status;
        this.isNew = isNew;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return tokenType != null ? tokenType : "Bearer";
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public String getGender() {
        return gender;
    }

    public Boolean getProfileCompleted() {
        return profileCompleted;
    }

    public Status getStatus() {
        return status;
    }

    public boolean isNew() {
        return isNew;
    }
}
