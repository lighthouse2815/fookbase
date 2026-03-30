package com.dang.app.dto.auth.request;

import com.dang.app.utils.enums.Gender;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private LocalDate birthday;
    private Gender gender;
    private String avatarUrl;
    private String displayName;
}
