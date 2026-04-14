package com.dang.app.dto.auth.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileInfoVisibilityResponse {
    private boolean displayNameVisible;
    private boolean phoneVisible;
    private boolean emailVisible;
    private boolean dateOfBirthVisible;
    private boolean genderVisible;
    private boolean friendCountVisible;
}
