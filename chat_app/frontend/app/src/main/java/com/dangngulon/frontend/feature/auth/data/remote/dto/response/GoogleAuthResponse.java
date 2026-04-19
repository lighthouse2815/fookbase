package com.dangngulon.frontend.feature.auth.data.remote.dto.response;

public class GoogleAuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String userId;
    private String displayName;
    private boolean isNew;

    public GoogleAuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            String userId,
            String displayName,
            boolean isNew
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.userId = userId;
        this.displayName = displayName;
        this.isNew = isNew;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return tokenType != null ? tokenType : "Bearer";
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isNew() {
        return isNew;
    }
}
