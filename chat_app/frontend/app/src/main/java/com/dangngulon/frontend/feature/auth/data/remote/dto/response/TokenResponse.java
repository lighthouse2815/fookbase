package com.dangngulon.frontend.feature.auth.data.remote.dto.response;

public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return tokenType != null ? tokenType : "Bearer";
    }
}
