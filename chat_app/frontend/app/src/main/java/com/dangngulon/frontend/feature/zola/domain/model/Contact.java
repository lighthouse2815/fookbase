package com.dangngulon.frontend.feature.zola.domain.model;

public class Contact {
    private String contactId;
    private String userId;
    private String avatarUrl;
    private String nickName;
    private String phoneNumber;

    public Contact() {
    }

    public Contact(String contactId, String userId, String avatarUrl, String nickName, String phoneNumber) {
        this.contactId = contactId;
        this.userId = userId;
        this.avatarUrl = avatarUrl;
        this.nickName = nickName;
        this.phoneNumber = phoneNumber;
    }

    public String getContactId() {
        return contactId;
    }

    public void setContactId(String contactId) {
        this.contactId = contactId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
