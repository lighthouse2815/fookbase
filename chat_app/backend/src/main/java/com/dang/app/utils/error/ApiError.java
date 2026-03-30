package com.dang.app.utils.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String error, int status, String message, String path, Map<String, Object> data) {

    public ApiError(
            String error,
            int status,
            String message,
            String path
    ) {
        this(error, status, message, path, null);
    }

}

