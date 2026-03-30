package com.dangngulon.frontend.domain.usecase.zola;

import android.content.Context;
import android.graphics.Bitmap;

import com.dangngulon.frontend.repository.zola.MediaRepository;

import javax.inject.Inject;

public class FullscreenQRUseCase {
    private final MediaRepository mediaRepository;

    @Inject
    public FullscreenQRUseCase(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    public boolean execute(Context context, Bitmap bitmap) {
        return mediaRepository.saveImage(context, bitmap);
    }
}
