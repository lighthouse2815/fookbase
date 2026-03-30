package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class UserProfileRequest {

    @NotNull
    private UUID userId;
}
