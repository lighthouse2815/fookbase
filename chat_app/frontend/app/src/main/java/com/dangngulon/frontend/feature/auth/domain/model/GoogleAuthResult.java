package com.dangngulon.frontend.feature.auth.domain.model;

public class GoogleAuthResult {
    private final String accessToken;
    private final String refreshToken;
    private final String userId;
    private final String displayName;
    private final boolean isNewUser;

    public GoogleAuthResult(
            String accessToken,
            String refreshToken,
            String userId,
            String displayName,
            boolean isNewUser
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.displayName = displayName;
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

    public boolean isNewUser() {
        return isNewUser;
    }
}
