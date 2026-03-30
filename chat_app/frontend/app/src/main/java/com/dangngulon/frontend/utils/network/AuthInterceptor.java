package com.dangngulon.frontend.utils.network;

import android.content.Context;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.utils.data.AuthManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;


public class AuthInterceptor implements Interceptor {

    private final AuthManager tokenManager;

    public AuthInterceptor(Context context) {
        tokenManager = new AuthManager(context);
    }

    @NonNull
    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        String path = original.url().encodedPath();

        // Cho phép auth API public đi thẳng (không attach Bearer),
        // nhưng vẫn phải attach cho các endpoint cần login: /api/auth/me/...
        if (path.startsWith("/api/auth") && !path.startsWith("/api/auth/me/")) {
            return chain.proceed(original);
        }

        String token = tokenManager.getAccessToken();

        if (token == null || token.isEmpty()) {
            return chain.proceed(original);
        }

        Request request = original.newBuilder()
                .header("Authorization", "Bearer " + token)
                .build();

        return chain.proceed(request);
    }

}

