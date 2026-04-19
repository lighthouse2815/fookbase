package com.dangngulon.frontend.feature.zola.data.repository;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;

import com.dangngulon.frontend.feature.zola.domain.repository.IMediaRepository;

import java.io.OutputStream;

import javax.inject.Inject;
import javax.inject.Singleton;

import dagger.hilt.android.qualifiers.ApplicationContext;

@Singleton
public class MediaRepository implements IMediaRepository {
    private static final String DEFAULT_PREFIX = "QR";
    private final Context context;

    @Inject
    public MediaRepository(@ApplicationContext Context context) {
        this.context = context;
    }

    @Override
    public boolean saveImage(byte[] imageData, String displayName) {
        if (imageData == null || imageData.length == 0) return false;
        ContentResolver resolver = context.getContentResolver();
        ContentValues values = new ContentValues();

        String prefix = (displayName == null || displayName.isBlank())
                ? DEFAULT_PREFIX
                : displayName;
        String fileName = prefix + "_" + System.currentTimeMillis() + ".png";

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
                    out.write(imageData);
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
