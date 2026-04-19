package com.dangngulon.frontend.feature.zola.domain.repository;

public interface IMediaRepository {
    boolean saveImage(byte[] imageData, String displayName);
}
