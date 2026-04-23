package com.dangngulon.frontend.core.network.interceptor;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.core.utils.data.AuthManager;

import java.io.IOException;

import javax.inject.Inject;

import okhttp3.HttpUrl;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;


public class AuthInterceptor implements Interceptor {

    private final AuthManager tokenManager;

    @Inject
    public AuthInterceptor(AuthManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    @NonNull
    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();

        // Do not leak bearer token to third-party hosts such as Cloudinary.
        HttpUrl baseUrl = HttpUrl.parse(BuildConfig.BASE_URL);
        if (baseUrl != null && !original.url().host().equalsIgnoreCase(baseUrl.host())) {
            return chain.proceed(original);
        }

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

