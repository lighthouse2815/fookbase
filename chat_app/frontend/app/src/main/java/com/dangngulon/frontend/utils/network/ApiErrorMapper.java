package com.dangngulon.frontend.utils.network;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.dangngulon.frontend.domain.common.AppError;
import com.dangngulon.frontend.model.error.ApiError;
import com.google.gson.Gson;

import java.io.Reader;

import okhttp3.ResponseBody;
import retrofit2.Response;

public class ApiErrorMapper {

    private final Gson gson;

    public ApiErrorMapper(Gson gson) {
        this.gson = gson;
    }

    @NonNull
    public String toMessage(@NonNull Response<?> response) {
        int code = response.code();

        String serverMessage = tryParseServerMessage(response.errorBody());
        if (serverMessage != null && !serverMessage.isBlank()) {
            return serverMessage;
        }

        if (code == 401) return "Phiên đăng nhập hết hạn";
        if (code == 403) return "Bạn không có quyền truy cập";
        if (code == 404) return "Không tìm thấy tài nguyên";
        if (code >= 500) return "Server đang bận, thử lại sau";

        return "Có lỗi xảy ra";
    }

    @NonNull
    public String toMessage(@NonNull Throwable t) {
        //  có thể phân loại IOException/SocketTimeoutException ở đây sau
        Log.e("NETWORK_ERROR", t.getClass().getName(), t);
        return "Không thể kết nối server";
    }

    @NonNull
    public AppError toAppError(@NonNull Response<?> response) {
        return new AppError(toMessage(response), response.code(), null);
    }

    @NonNull
    public AppError toAppError(@NonNull Throwable t) {
        return new AppError(toMessage(t), null, t);
    }

    @Nullable
    private String tryParseServerMessage(@Nullable ResponseBody errorBody) {
        if (errorBody == null) return null;

        try (ResponseBody body = errorBody) {
            Reader reader = body.charStream();
            ApiError apiError = gson.fromJson(reader, ApiError.class);
            return apiError != null ? apiError.getMessage() : null;
        } catch (Exception ignore) {
            return null;
        }
    }
}
