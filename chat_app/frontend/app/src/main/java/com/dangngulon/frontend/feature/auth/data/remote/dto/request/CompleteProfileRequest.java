package com.dangngulon.frontend.feature.auth.data.remote.dto.request;

public class CompleteProfileRequest {

    private final String firstName;
    private final String lastName;
    private final String phoneNumber;
    private final String birthday;
    private final String gender;
    private final String avatarUrl;
    private final String displayName;

    public CompleteProfileRequest(
            String firstName,
            String lastName,
            String phoneNumber,
            String birthday,
            String gender,
            String avatarUrl,
            String displayName
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.birthday = birthday;
        this.gender = gender;
        this.avatarUrl = avatarUrl;
        this.displayName = displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getBirthday() {
        return birthday;
    }

    public String getGender() {
        return gender;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getDisplayName() {
        return displayName;
    }
}
