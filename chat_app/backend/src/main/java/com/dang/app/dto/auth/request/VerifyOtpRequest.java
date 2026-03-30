package com.dang.app.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest{

    @Email
    private String email;

    @NotBlank
    private String otp;
}




