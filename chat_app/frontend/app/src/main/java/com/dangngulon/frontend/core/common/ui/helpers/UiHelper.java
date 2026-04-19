package com.dangngulon.frontend.core.common.ui.helpers;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.StringRes;
import androidx.annotation.ColorRes;
import androidx.annotation.IdRes;
import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import com.google.android.material.textfield.TextInputEditText;

public class UiHelper {

    private UiHelper(){}

    public static void hideActionBar(@NonNull AppCompatActivity activity) {
        ActionBar actionBar = activity.getSupportActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
    }

    public static void setupBottomNavigation(
            @NonNull Activity activity,
            @IdRes int bottomNavId,
            @ColorRes int navBarColorRes
    ) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);

        View bottomNav = activity.findViewById(bottomNavId);
        ViewCompat.setOnApplyWindowInsetsListener(bottomNav, (v, insets) -> {
            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            v.setPadding(0, 0, 0, bottomInset);
            return insets;
        });

        activity.getWindow().setNavigationBarColor(
                ContextCompat.getColor(activity, navBarColorRes)
        );
    }

    public static void setupBottomNavigation(
            @NonNull Fragment fragment,
            @NonNull View bottomNav,
            @ColorRes int navBarColorRes
    ) {
        Activity activity = fragment.requireActivity();

        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);

        ViewCompat.setOnApplyWindowInsetsListener(bottomNav, (v, insets) -> {
            int bottomInset =
                    insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            v.setPadding(0, 0, 0, bottomInset);
            return insets;
        });

        activity.getWindow().setNavigationBarColor(
                ContextCompat.getColor(activity, navBarColorRes)
        );
    }

    // nho goi WindowCompat.setDecorFitsSystemWindows(window, false);
    public static void applySystemWindowInsets(Dialog dialog, @IdRes int rootLayoutId) {
        if (dialog == null) return;

        View root = dialog.findViewById(rootLayoutId);
        if (root == null) return;

        int paddingLeft = root.getPaddingLeft();
        int paddingTop = root.getPaddingTop();
        int paddingRight = root.getPaddingRight();
        int paddingBottom = root.getPaddingBottom();

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());

            v.setPadding(
                    paddingLeft,
                    paddingTop + systemBars.top,
                    paddingRight,
                    paddingBottom + systemBars.bottom
            );
            return insets;
        });
    }

    public static void applySystemWindowInsets(Fragment fragment, @IdRes int rootId) {

        if (fragment.getView() == null) return;

        View root = fragment.getView().findViewById(rootId);
        if (root == null) return;

        int paddingLeft = root.getPaddingLeft();
        int paddingTop = root.getPaddingTop();
        int paddingRight = root.getPaddingRight();
        int paddingBottom = root.getPaddingBottom();

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {

            Insets systemBars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
            );

            v.setPadding(
                    paddingLeft + systemBars.left,
                    paddingTop + systemBars.top,
                    paddingRight + systemBars.right,
                    paddingBottom + systemBars.bottom
            );

            return insets;
        });
    }

    public static void showToast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }

    public static void showToast(Context context, @StringRes int messageRes) {
        Toast.makeText(context, messageRes, Toast.LENGTH_SHORT).show();
    }

    public static String getText(TextInputEditText editText) {
        return editText.getText() == null
                ? ""
                : editText.getText().toString().trim();
    }





}
