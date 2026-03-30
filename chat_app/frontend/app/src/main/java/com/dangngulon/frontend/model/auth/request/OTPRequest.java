package com.dangngulon.frontend.model.auth.request;

import com.dangngulon.frontend.utils.enums.OTPType;

public class OTPRequest {

    private String email;
    private OTPType type;

    public OTPRequest(String email, OTPType type) {
        this.email = email;
        this.type = type;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public OTPType getType() {
        return type;
    }

    public void setType(OTPType type) {
        this.type = type;
    }


}

