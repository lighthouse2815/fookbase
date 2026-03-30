package com.dangngulon.frontend.repository.zola;

import android.content.Context;
import android.graphics.Bitmap;

public interface MediaRepository {
    boolean saveImage(Context context, Bitmap bitmap);
}