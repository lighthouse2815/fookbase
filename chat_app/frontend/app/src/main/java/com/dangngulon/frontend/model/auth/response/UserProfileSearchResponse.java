package com.dangngulon.frontend.model.auth.response;

import androidx.annotation.Keep;


@Keep
public class UserProfileSearchResponse {
    private String userId;
    private String displayName;
    private String phoneNumber;
    private String avatarUrl;
    private String status;

    public UserProfileSearchResponse() {
    }

    public UserProfileSearchResponse(String userId, String displayName, String phoneNumber, String avatarUrl, String status) {
        this.userId = userId;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
        this.status = status;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public void setStatus(String status){
        this.status = status;
    }

    public String getStatus(){
        return status;
    }
}
