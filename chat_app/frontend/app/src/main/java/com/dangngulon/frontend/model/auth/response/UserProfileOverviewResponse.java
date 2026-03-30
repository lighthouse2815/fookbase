package com.dangngulon.frontend.model.auth.response;

public class UserProfileOverviewResponse {

    private String displayName;
    private String phoneNumber;
    private String email;
    private String birthDate;

    public UserProfileOverviewResponse() {}

    public UserProfileOverviewResponse(
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

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBirthDate() {
        return birthDate;
    }

}

