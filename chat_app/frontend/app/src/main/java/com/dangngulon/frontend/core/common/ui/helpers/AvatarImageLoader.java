package com.dangngulon.frontend.core.common.ui.helpers;

import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.utils.AvatarDefaults;

public final class AvatarImageLoader {

    private AvatarImageLoader() {
    }

    public static void load(@NonNull ImageView imageView, @Nullable String avatarUrl) {
        Glide.with(imageView)
                .load(AvatarDefaults.resolve(avatarUrl))
                .placeholder(R.drawable.default_avatar)
                .error(R.drawable.default_avatar)
                .fallback(R.drawable.default_avatar)
                .circleCrop()
                .into(imageView);
    }
}
