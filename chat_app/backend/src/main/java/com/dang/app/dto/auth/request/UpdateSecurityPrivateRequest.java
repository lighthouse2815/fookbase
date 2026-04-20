package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

@Data
public class UpdateSecurityPrivateRequest {

    private String username;

    private String phoneNumber;

    @AssertTrue(message = "exactly one of username or phoneNumber is required")
    public boolean isExactlyOneFieldProvided() {
        return hasText(username) ^ hasText(phoneNumber);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
