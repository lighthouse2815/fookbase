package com.dangngulon.frontend.domain.common;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Result dùng chung toàn app (framework-agnostic).
 * Không mang theo retrofit2.Response, okhttp3.ResponseBody, v.v...
 */
public abstract class AppResult<T> {

    private AppResult() {
        // Prevent external inheritance
    }

    public static final class Success<T> extends AppResult<T> {
        @Nullable
        private final T data;

        public Success(@Nullable T data) {
            this.data = data;
        }

        @Nullable
        public T getData() {
            return data;
        }
    }

    public static final class Error<T> extends AppResult<T> {
        @NonNull
        private final AppError error;

        public Error(@NonNull AppError error) {
            this.error = error;
        }

        @NonNull
        public AppError getError() {
            return error;
        }
    }

    // Factory helpers (optional nhưng tiện dùng)
    @NonNull
    public static <T> AppResult<T> success(@Nullable T data) {
        return new Success<>(data);
    }

    @NonNull
    public static <T> AppResult<T> error(@NonNull AppError error) {
        return new Error<>(error);
    }

    @NonNull
    public static <T> AppResult<T> error(@NonNull String message, @Nullable Integer code, @Nullable Throwable cause) {
        return new Error<>(new AppError(message, code, cause));
    }
}
