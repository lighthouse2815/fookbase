package com.dangngulon.frontend.core.utils;

public final class AvatarDefaults {

    public static final String DEFAULT_AVATAR_URL =
            "https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg";

    private AvatarDefaults() {
    }

    public static String resolve(String avatarUrl) {
        if (avatarUrl == null) {
            return DEFAULT_AVATAR_URL;
        }

        String trimmed = avatarUrl.trim();
        return trimmed.isEmpty() ? DEFAULT_AVATAR_URL : trimmed;
    }
}
