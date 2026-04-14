package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateProfileInfoVisibilityRequest {
    @NotNull
    private Boolean fullNameVisible;

    @NotNull
    private Boolean phoneVisible;

    @NotNull
    private Boolean emailVisible;

    @NotNull
    private Boolean dateOfBirthVisible;

    @NotNull
    private Boolean genderVisible;

    @NotNull
    private Boolean friendCountVisible;
}
