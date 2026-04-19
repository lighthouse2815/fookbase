package com.dangngulon.frontend.feature.auth.domain.model;

import com.dangngulon.frontend.core.utils.enums.Status;

public class AuthSession {
    private final String accessToken;
    private final String refreshToken;
    private final String userId;
    private final String displayName;
    private final boolean profileCompleted;
    private final Status status;
    private final String avatarUrl;

    public AuthSession(
            String accessToken,
            String refreshToken,
            String userId,
            String displayName,
            boolean profileCompleted,
            Status status,
            String avatarUrl
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.displayName = displayName;
        this.profileCompleted = profileCompleted;
        this.status = status;
        this.avatarUrl = avatarUrl;
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

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public Status getStatus() {
        return status;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }
}
