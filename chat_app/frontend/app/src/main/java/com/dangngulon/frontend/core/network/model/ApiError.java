package com.dangngulon.frontend.core.network.model;

import java.util.Map;

public class ApiError {

    private String error;
    private int status;
    private String message;
    private String path;
    private Map<String, Object> data;

    public String getError() {
        return error;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public Map<String, Object> getData() {
        return data;
    }
}

