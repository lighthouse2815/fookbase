package com.dangngulon.frontend.model.auth.request;

public class ResetPasswordRequest {

    private String newPassword;

    public ResetPasswordRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }
}

