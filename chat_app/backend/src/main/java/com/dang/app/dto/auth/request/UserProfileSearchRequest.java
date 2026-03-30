package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserProfileSearchRequest {

    @NotBlank
    private String phoneNumber;
}
