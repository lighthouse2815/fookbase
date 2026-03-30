package com.dangngulon.frontend.repository.zola_impl;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import com.dangngulon.frontend.repository.zola.MediaRepository;

import java.io.OutputStream;

import javax.inject.Inject;
import javax.inject.Singleton;

@Singleton
public class MediaRepositoryImpl implements MediaRepository {

    @Inject
    public MediaRepositoryImpl() {
    }

    @Override
    public boolean saveImage(Context context, Bitmap bitmap) {
        if (bitmap == null) return false;

        ContentResolver resolver = context.getContentResolver();
        ContentValues values = new ContentValues();

        String fileName = "QR_" + System.currentTimeMillis() + ".png";

        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, "image/png");

        Uri uri = null;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                        Environment.DIRECTORY_PICTURES + "/MyApp");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            }

            uri = resolver.insert(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    values
            );

            if (uri == null) return false;

            try (OutputStream out = resolver.openOutputStream(uri)) {
                if (out != null) {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            }

            return true;

        } catch (Exception e) {
            if (uri != null) {
                resolver.delete(uri, null, null);
            }

            Log.e("QrGallery", "Save failed", e);
            return false;
        }
    }
}
