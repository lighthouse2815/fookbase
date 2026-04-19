package com.dangngulon.frontend.feature.zola.presentation.error;

import com.dangngulon.frontend.core.common.errors.AddFriendError;

public final class AddFriendErrorMapper {

    private AddFriendErrorMapper() {
    }

    public enum ErrorType {
        USER_ID_EMPTY,
        UNKNOWN
    }

    public static ErrorType map(String code) {
        if (AddFriendError.USER_ID_EMPTY.name().equals(code)) {
            return ErrorType.USER_ID_EMPTY;
        }

        return ErrorType.UNKNOWN;
    }
}
