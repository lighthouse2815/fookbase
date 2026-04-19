package com.dangngulon.frontend.feature.auth.domain.model;

public class AuthSession {
    private final String accessToken;
    private final String refreshToken;
    private final String userId;
    private final String displayName;

    public AuthSession(String accessToken, String refreshToken, String userId, String displayName) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.displayName = displayName;
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
}
