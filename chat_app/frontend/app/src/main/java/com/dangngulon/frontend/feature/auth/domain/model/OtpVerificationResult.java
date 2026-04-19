package com.dangngulon.frontend.feature.auth.domain.model;

public class OtpVerificationResult {
    private final String result;

    public OtpVerificationResult(String result) {
        this.result = result;
    }

    public String getResult() {
        return result;
    }
}
