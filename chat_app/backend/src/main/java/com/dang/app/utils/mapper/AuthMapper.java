package com.dang.app.utils.mapper;

import com.dang.app.dto.auth.response.LoginResponse;
import com.dang.app.dto.auth.response.MessageResponse;
import com.dang.app.dto.auth.response.OtpVerifyResponse;
import com.dang.app.dto.auth.response.RegisterResponse;
import com.dang.app.dto.auth.response.TokenResponse;
import com.dang.app.dto.auth.response.GoogleAuthResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.utils.enums.OTPType;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {
    private static final String OTP_SENT_MESSAGE = "OTP đã được gửi";
    private static final String OTP_VERIFIED_MESSAGE = "Xác nhận otp thành công";
    private static final String RESET_PASSWORD_SUCCESS_MESSAGE = "Đặt lại mật khẩu thành công!";

    public RegisterResponse toRegisterResponse(User user) {
        return RegisterResponse.builder()
                .username(user.getUsername())
                .message("Đăng ký thành công")
                .build();
    }

    public LoginResponse toLoginResponse(
            String accessToken,
            String refreshToken,
            User user,
            UserProfile userProfile
    ) {
        return LoginResponse.builder()
                .token(accessToken)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .role(user.getRole())
                .displayName(userProfile.getDisplayName())
                .profileCompleted(userProfile.isCompleted())
                .status(user.getStatus())
                .email(userProfile.getEmail())
                .avatarUrl(userProfile.getAvatarUrl())
                .build();
    }

    public OtpVerifyResponse toOtpSentResponse() {
        return new OtpVerifyResponse(OTP_SENT_MESSAGE);
    }

    public OtpVerifyResponse toOtpVerifyResponse(OTPType otpType, String resetToken) {
        if (otpType == OTPType.PASSWORD_RESET) {
            return new OtpVerifyResponse(resetToken);
        }

        return new OtpVerifyResponse(OTP_VERIFIED_MESSAGE);
    }

    public GoogleAuthResponse toGoogleAuthResponse(
            TokenResponse tokenResponse,
            User user,
            UserProfile profile,
            boolean isNew
    ) {
        return GoogleAuthResponse.builder()
                .accessToken(tokenResponse.getAccessToken())
                .refreshToken(tokenResponse.getRefreshToken())
                .tokenType(tokenResponse.getTokenType())
                .userId(user.getId())
                .displayName(profile.getDisplayName())
                .isNew(isNew)
                .build();
    }

    public MessageResponse toResetPasswordResponse() {
        return new MessageResponse(RESET_PASSWORD_SUCCESS_MESSAGE);
    }
}
