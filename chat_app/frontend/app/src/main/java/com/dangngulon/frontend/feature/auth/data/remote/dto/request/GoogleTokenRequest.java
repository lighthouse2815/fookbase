package com.dangngulon.frontend.feature.auth.data.remote.dto.request;

public class GoogleTokenRequest {

    private String tokenId;

    public GoogleTokenRequest(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getTokenId() {
        return tokenId;
    }
}

