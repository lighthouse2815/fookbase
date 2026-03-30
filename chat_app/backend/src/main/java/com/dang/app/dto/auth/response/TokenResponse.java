package com.dang.app.dto.auth.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class TokenResponse {

    private String accessToken;

    private String refreshToken;

    private String tokenType;
}
