package com.dang.app.dto.auth.request;

import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}
