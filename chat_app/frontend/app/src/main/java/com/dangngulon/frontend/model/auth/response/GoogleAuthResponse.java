package com.dangngulon.frontend.model.auth.response;

public class GoogleAuthResponse {

    private String accessToken;
    private boolean isNew;

    public GoogleAuthResponse(String accessToken, boolean isNew) {
        this.accessToken = accessToken;
        this.isNew = isNew;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public boolean isNew() {
        return isNew;
    }
}
