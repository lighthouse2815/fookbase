package com.dangngulon.frontend.feature.auth.domain.model;

import com.dangngulon.frontend.core.utils.enums.Status;

public class GoogleAuthResult {
    private final String accessToken;
    private final String refreshToken;
    private final String userId;
    private final String displayName;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String phoneNumber;
    private final String avatarUrl;
    private final String birthDate;
    private final String gender;
    private final boolean profileCompleted;
    private final Status status;
    private final boolean isNewUser;

    public GoogleAuthResult(
            String accessToken,
            String refreshToken,
            String userId,
            String displayName,
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String avatarUrl,
            String birthDate,
            String gender,
            boolean profileCompleted,
            Status status,
            boolean isNewUser
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
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
        this.isNewUser = isNewUser;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
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

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public Status getStatus() {
        return status;
    }

    public boolean isNewUser() {
        return isNewUser;
    }
}
