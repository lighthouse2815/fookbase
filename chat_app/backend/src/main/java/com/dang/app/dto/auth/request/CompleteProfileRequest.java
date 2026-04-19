package com.dang.app.dto.auth.request;

import com.dang.app.utils.enums.Gender;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompleteProfileRequest {

    private String firstName;

    private String lastName;

    private String phoneNumber;

    @NotNull
    private LocalDate birthday;

    @NotNull
    private Gender gender;

    private String avatarUrl;

    private String displayName;
}
