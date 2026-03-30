package com.dangngulon.frontend.model.auth.request;

import androidx.annotation.Keep;

@Keep
public class UserProfileSearchRequest {
    private String phoneNumber;

    public UserProfileSearchRequest() {
    }

    public UserProfileSearchRequest(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
