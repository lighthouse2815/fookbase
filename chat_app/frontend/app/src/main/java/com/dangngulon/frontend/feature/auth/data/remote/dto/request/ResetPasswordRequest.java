package com.dangngulon.frontend.feature.auth.data.remote.dto.request;

public class ResetPasswordRequest {

    private String newPassword;

    public ResetPasswordRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }
}

