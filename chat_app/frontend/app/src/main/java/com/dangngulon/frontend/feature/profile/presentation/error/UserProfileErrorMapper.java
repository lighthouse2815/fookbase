package com.dangngulon.frontend.feature.profile.presentation.error;

import com.dangngulon.frontend.core.common.errors.UserProfileError;

public final class UserProfileErrorMapper {
    private UserProfileErrorMapper() {
    }

    public enum ErrorType {
        PHONE_NUMBER_EMPTY,
        PHONE_NUMBER_INVALID,
        UNKNOWN
    }

    public static ErrorType map(String code) {
        if (UserProfileError.PHONE_NUMBER_EMPTY.name().equals(code)) {
            return ErrorType.PHONE_NUMBER_EMPTY;
        }

        if (UserProfileError.PHONE_NUMBER_INVALID.name().equals(code)) {
            return ErrorType.PHONE_NUMBER_INVALID;
        }

        return ErrorType.UNKNOWN;
    }
}
