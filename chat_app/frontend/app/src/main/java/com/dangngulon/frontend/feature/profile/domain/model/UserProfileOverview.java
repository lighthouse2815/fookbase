package com.dangngulon.frontend.feature.profile.domain.model;

public class UserProfileOverview {
    private final String displayName;
    private final String phoneNumber;
    private final String email;
    private final String birthDate;

    public UserProfileOverview(
            String displayName,
            String phoneNumber,
            String email,
            String birthDate
    ) {
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.birthDate = birthDate;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public String getBirthDate() {
        return birthDate;
    }
}
