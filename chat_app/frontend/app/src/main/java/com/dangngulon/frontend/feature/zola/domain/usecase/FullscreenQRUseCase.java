package com.dangngulon.frontend.feature.zola.domain.usecase;

import com.dangngulon.frontend.feature.zola.domain.repository.IMediaRepository;

import javax.inject.Inject;

public class FullscreenQRUseCase {
    private final IMediaRepository mediaRepository;

    @Inject
    public FullscreenQRUseCase(IMediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    public boolean execute(byte[] imageData, String displayName) {
        return mediaRepository.saveImage(imageData, displayName);
    }
}
