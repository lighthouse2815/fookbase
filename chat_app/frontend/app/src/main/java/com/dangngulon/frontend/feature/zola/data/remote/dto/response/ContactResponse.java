package com.dangngulon.frontend.feature.zola.data.remote.dto.response;

import java.util.UUID;

public class ContactResponse {
    private UUID contactId;
    private UUID userId;
    private String avatarUrl;
    private String nickName;
    private String phoneNumber;

    public ContactResponse() {}

    public ContactResponse(UUID contactId, UUID userId, String avatarUrl, String nickName, String phoneNumber) {
        this.contactId = contactId;
        this.userId = userId;
        this.avatarUrl = avatarUrl;
        this.nickName = nickName;
        this.phoneNumber = phoneNumber;
    }

    public UUID getContactId() {
        return contactId;
    }

    public void setContactId(UUID contactId) {
        this.contactId = contactId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
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

