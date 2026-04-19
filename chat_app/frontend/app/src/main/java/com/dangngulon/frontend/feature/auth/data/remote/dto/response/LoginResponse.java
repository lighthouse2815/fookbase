package com.dangngulon.frontend.feature.auth.data.remote.dto.response;

import com.dangngulon.frontend.core.utils.enums.Role;
import com.dangngulon.frontend.core.utils.enums.Status;

public class LoginResponse {

    private String token;
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String userId;
    private String displayName;
    private Role role;
    private Boolean profileCompleted;
    private Status status;
    private String avatarUrl;

    public String getToken() {
        return token;
    }

    public String getAccessToken() {
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            return accessToken;
        }
        return token;
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

    public Role getRole() {
        return role;
    }

    public Boolean getProfileCompleted() {
        return profileCompleted;
    }

    public Status getStatus() {
        return status;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }
}
