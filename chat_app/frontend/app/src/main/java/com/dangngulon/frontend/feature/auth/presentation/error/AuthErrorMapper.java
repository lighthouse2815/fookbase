package com.dangngulon.frontend.feature.auth.presentation.error;

import com.dangngulon.frontend.core.common.errors.ForgotPasswordError;
import com.dangngulon.frontend.core.common.errors.LoginError;
import com.dangngulon.frontend.core.common.errors.RegisterError;

public final class AuthErrorMapper {
    private AuthErrorMapper() {
    }

    public enum LoginErrorType {
        USERNAME_EMPTY,
        PASSWORD_EMPTY,
        UNKNOWN
    }

    public enum ForgotPasswordErrorType {
        EMAIL_EMPTY,
        OTP_EMPTY,
        PASSWORD_EMPTY,
        PASSWORD_INVALID,
        CONFIRM_PASSWORD_EMPTY,
        PASSWORD_NOT_MATCH,
        TOKEN_INVALID,
        UNKNOWN
    }

    public enum RegisterErrorType {
        LAST_NAME_EMPTY,
        FIRST_NAME_EMPTY,
        EMAIL_EMPTY,
        USERNAME_EMPTY,
        PASSWORD_EMPTY,
        PASSWORD_INVALID,
        CONFIRM_PASSWORD_EMPTY,
        PASSWORD_NOT_MATCH,
        OTP_EMPTY,
        UNKNOWN
    }

    public static LoginErrorType mapLoginError(String code) {
        if (LoginError.USERNAME_EMPTY.name().equals(code)) {
            return LoginErrorType.USERNAME_EMPTY;
        }

        if (LoginError.PASSWORD_EMPTY.name().equals(code)) {
            return LoginErrorType.PASSWORD_EMPTY;
        }

        return LoginErrorType.UNKNOWN;
    }

    public static ForgotPasswordErrorType mapForgotPasswordError(String code) {
        if (ForgotPasswordError.EMAIL_EMPTY.name().equals(code)) {
            return ForgotPasswordErrorType.EMAIL_EMPTY;
        }

        if (ForgotPasswordError.OTP_EMPTY.name().equals(code)) {
            return ForgotPasswordErrorType.OTP_EMPTY;
        }

        if (ForgotPasswordError.PASSWORD_EMPTY.name().equals(code)) {
            return ForgotPasswordErrorType.PASSWORD_EMPTY;
        }

        if (ForgotPasswordError.PASSWORD_INVALID.name().equals(code)) {
            return ForgotPasswordErrorType.PASSWORD_INVALID;
        }

        if (ForgotPasswordError.CONFIRM_PASSWORD_EMPTY.name().equals(code)) {
            return ForgotPasswordErrorType.CONFIRM_PASSWORD_EMPTY;
        }

        if (ForgotPasswordError.PASSWORD_NOT_MATCH.name().equals(code)) {
            return ForgotPasswordErrorType.PASSWORD_NOT_MATCH;
        }

        if (ForgotPasswordError.TOKEN_INVALID.name().equals(code)) {
            return ForgotPasswordErrorType.TOKEN_INVALID;
        }

        return ForgotPasswordErrorType.UNKNOWN;
    }

    public static RegisterErrorType mapRegisterError(String code) {
        if (RegisterError.LAST_NAME_EMPTY.name().equals(code)) {
            return RegisterErrorType.LAST_NAME_EMPTY;
        }

        if (RegisterError.FIRST_NAME_EMPTY.name().equals(code)) {
            return RegisterErrorType.FIRST_NAME_EMPTY;
        }

        if (RegisterError.EMAIL_EMPTY.name().equals(code)) {
            return RegisterErrorType.EMAIL_EMPTY;
        }

        if (RegisterError.USERNAME_EMPTY.name().equals(code)) {
            return RegisterErrorType.USERNAME_EMPTY;
        }

        if (RegisterError.PASSWORD_EMPTY.name().equals(code)) {
            return RegisterErrorType.PASSWORD_EMPTY;
        }

        if (RegisterError.PASSWORD_INVALID.name().equals(code)) {
            return RegisterErrorType.PASSWORD_INVALID;
        }

        if (RegisterError.CONFIRM_PASSWORD_EMPTY.name().equals(code)) {
            return RegisterErrorType.CONFIRM_PASSWORD_EMPTY;
        }

        if (RegisterError.PASSWORD_NOT_MATCH.name().equals(code)) {
            return RegisterErrorType.PASSWORD_NOT_MATCH;
        }

        if (RegisterError.OTP_EMPTY.name().equals(code)) {
            return RegisterErrorType.OTP_EMPTY;
        }

        return RegisterErrorType.UNKNOWN;
    }
}
