package com.dang.app.dto.auth.response;

import com.dang.app.utils.enums.Role;
import com.dang.app.utils.enums.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class LoginResponse {

    @NotBlank
    private String token;

    private String accessToken;

    private String refreshToken;

    private String tokenType = "Bearer";

    @NotNull
    private UUID userId;

    @NotBlank
    private String displayName;

    @NotNull
    private Role role;

    @NotNull
    private  Boolean profileCompleted;

    @NotNull
    private Status status;

    private String avatarUrl;
}
