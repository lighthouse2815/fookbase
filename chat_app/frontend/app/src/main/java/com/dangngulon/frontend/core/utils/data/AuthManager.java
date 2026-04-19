package com.dangngulon.frontend.core.utils.data;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import javax.inject.Inject;
import javax.inject.Singleton;

@Singleton
public class AuthManager {
    private static final String TAG = "AuthManager";

    private static final String PREF_NAME = "auth";

    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    private static final String KEY_USER_ID = "user_id";

    private static final String KEY_DISPLAY_NAME = "display_name";

    private final SharedPreferences prefs;

    @Inject
    public AuthManager(Context context) {
        SharedPreferences localPrefs;

        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            localPrefs = EncryptedSharedPreferences.create(
                    context,
                    PREF_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );

        } catch (Exception e) {
            Log.e(TAG, "Failed to init encrypted storage, fallback to SharedPreferences", e);
            localPrefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        }

        prefs = localPrefs;
    }

    public void saveAuth(String accessToken,
                         String refreshToken,
                         String userId,
                         String displayName
    ) {
        prefs.edit()
                .putString(KEY_ACCESS_TOKEN, accessToken)
                .putString(KEY_REFRESH_TOKEN, refreshToken)
                .putString(KEY_USER_ID, userId)
                .putString(KEY_DISPLAY_NAME, displayName)
                .apply();
    }

    public String getAccessToken() {
        return prefs.getString(KEY_ACCESS_TOKEN, null);
    }

    public String getRefreshToken() {
        return prefs.getString(KEY_REFRESH_TOKEN, null);
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, null);
    }

    public String getDisplayName() {
        return prefs.getString(KEY_DISPLAY_NAME, null);
    }

    public void clear() {
        prefs.edit().clear().apply();
    }
}
