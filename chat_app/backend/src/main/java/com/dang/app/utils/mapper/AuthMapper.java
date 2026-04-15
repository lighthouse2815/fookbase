package com.dang.app.utils.mapper;

import com.dang.app.dto.auth.response.LoginResponse;
import com.dang.app.dto.auth.response.RegisterResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.auth.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

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
}
