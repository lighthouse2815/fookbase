package com.dang.app.dto.auth.response;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GoogleAuthResponse {

    @NotBlank
    private String accessToken;

    private boolean isNew;
}
