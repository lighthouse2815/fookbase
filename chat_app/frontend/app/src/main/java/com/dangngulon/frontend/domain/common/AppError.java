package com.dangngulon.frontend.domain.common;

import androidx.annotation.Nullable;

public final class AppError {

    private final String message;

    @Nullable
    private final Integer code;

    @Nullable
    private final Throwable cause;

    public AppError(String message, @Nullable Integer code, @Nullable Throwable cause) {
        this.message = message != null ? message : "Có lỗi xảy ra";
        this.code = code;
        this.cause = cause;
    }

    public AppError(String message) {
        this(message, null, null);
    }

    public String getMessage() {
        return message;
    }

    @Nullable
    public Integer getCode() {
        return code;
    }

    @Nullable
    public Throwable getCause() {
        return cause;
    }



}
