package com.dangngulon.frontend.model.auth.request;

public class RegisterRequest {
    private String username;

    private String password;

    private String email;

    private String lastName;

    private String firstName;

    public RegisterRequest(String username, String password, String email, String lastName, String firstName) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.lastName = lastName;
        this.firstName = firstName;
    }
}
