package com.dang.app.dto.auth.response;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class GoogleAuthResponse {

    @NotBlank
    private String accessToken;

    private String refreshToken;

    private String tokenType;

    private UUID userId;

    private String displayName;

    private boolean isNew;
}
