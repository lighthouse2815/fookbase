package com.dangngulon.frontend.feature.auth.domain.model;

public class RegisterAccountResult {
    private final String username;

    public RegisterAccountResult(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}
