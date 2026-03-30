package com.dangngulon.frontend.model.auth.request;

public class GoogleTokenRequest {

    private String tokenId;

    public GoogleTokenRequest(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getTokenId() {
        return tokenId;
    }
}

