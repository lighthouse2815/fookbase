package com.dang.app.dto.auth.request;

import lombok.Data;

@Data
public class RefreshTokenRequest {
    private String refreshToken;
}
