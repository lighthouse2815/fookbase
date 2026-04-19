package com.dangngulon.frontend.feature.auth.data.mapper;

import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.GoogleAuthResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.LoginResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.OtpVerifyResponse;
import com.dangngulon.frontend.feature.auth.data.remote.dto.response.RegisterResponse;

public final class AuthResponseMapper {
    private AuthResponseMapper() {
    }

    public static AuthSession toAuthSession(LoginResponse response) {
        if (response == null) {
            return new AuthSession(null, null, null, null);
        }

        return new AuthSession(
                response.getAccessToken(),
                response.getRefreshToken(),
                response.getUserId(),
                response.getDisplayName()
        );
    }

    public static GoogleAuthResult toGoogleAuthResult(GoogleAuthResponse response) {
        if (response == null) {
            return new GoogleAuthResult(null, null, null, null, false);
        }

        return new GoogleAuthResult(
                response.getAccessToken(),
                response.getRefreshToken(),
                response.getUserId(),
                response.getDisplayName(),
                response.isNew()
        );
    }

    public static RegisterAccountResult toRegisterAccountResult(RegisterResponse response) {
        if (response == null) {
            return new RegisterAccountResult(null);
        }

        return new RegisterAccountResult(response.getUsername());
    }

    public static OtpVerificationResult toOtpVerificationResult(OtpVerifyResponse response) {
        if (response == null) {
            return new OtpVerificationResult(null);
        }

        return new OtpVerificationResult(response.getResult());
    }
}
