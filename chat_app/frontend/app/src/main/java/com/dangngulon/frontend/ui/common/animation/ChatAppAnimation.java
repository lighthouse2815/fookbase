package com.dangngulon.frontend.ui.common.animation;

import android.app.Dialog;
import android.content.Context;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.OvershootInterpolator;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.R;

public final class ChatAppAnimation {

    private ChatAppAnimation() {}

    // Tab Layout Animations
    public static void showTabLayoutWithFadeIn(
            @NonNull View tabLayout,
            long duration
    ) {
        if (tabLayout.getVisibility() != View.VISIBLE) {
            tabLayout.setVisibility(View.VISIBLE);
            tabLayout.setAlpha(0);
            tabLayout.animate()
                    .alpha(1)
                    .setDuration(duration)
                    .start();
        }
    }

    public static void hideTabLayoutWithFadeOut(
            @NonNull View tabLayout,
            long duration
    ) {
        if (tabLayout.getVisibility() == View.VISIBLE) {
            tabLayout.animate()
                    .alpha(0)
                    .setDuration(duration)
                    .withEndAction(() -> tabLayout.setVisibility(View.GONE))
                    .start();
        }
    }

    // Header and Bottom Navigation Animations
    public static void hideHeaderAndBottomNavWithAnimation(
            @NonNull Context context,
            @NonNull View headerLayout,
            @NonNull View bottomNavigation,
            @NonNull View tabLayout,
            long duration
    ) {
        clearAnimations(headerLayout, bottomNavigation);
        
        Animation fadeOut = AnimationUtils.loadAnimation(context, R.anim.fade_out);
        fadeOut.setDuration(duration);
        fadeOut.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
                // No-op: No action needed when the press animation starts
            }

            @Override
            public void onAnimationEnd(Animation animation) {
                headerLayout.setVisibility(View.GONE);
                bottomNavigation.setVisibility(View.GONE);
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
                // No-op: This animation does not repeat
            }
        });
        
        headerLayout.startAnimation(fadeOut);
        bottomNavigation.startAnimation(fadeOut);
        tabLayout.setVisibility(View.GONE);
    }

    public static void showHeaderAndBottomNavWithAnimation(
            @NonNull Context context,
            @NonNull View headerLayout,
            @NonNull View bottomNavigation,
            long duration
    ) {
        clearAnimations(headerLayout, bottomNavigation);
        
        Animation fadeIn = AnimationUtils.loadAnimation(context, R.anim.fade_in);
        fadeIn.setDuration(duration);
        
        headerLayout.setVisibility(View.VISIBLE);
        bottomNavigation.setVisibility(View.VISIBLE);
        
        headerLayout.startAnimation(fadeIn);
        bottomNavigation.startAnimation(fadeIn);
    }

    // Helper method
    private static void clearAnimations(@NonNull View... views) {
        for (View v : views) {
            if (v != null) {
                v.clearAnimation();
            }
        }
    }


    // addfriend fragment animation

    public static void animateCardEntrance(View view) {
        if (view == null) return;

        view.setAlpha(0f);
        view.setScaleX(0.8f);
        view.setScaleY(0.8f);

        view.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(400)
                .setInterpolator(new OvershootInterpolator(1.2f))
                .start();
    }

    public static void animateCardClick(View view) {
        if (view == null) return;

        view.animate()
                .scaleX(0.95f)
                .scaleY(0.95f)
                .setDuration(100)
                .withEndAction(() ->
                        view.animate()
                                .scaleX(1f)
                                .scaleY(1f)
                                .setDuration(100)
                                .start()
                )
                .start();
    }

    public static void animateButtonClick(View view) {
        if (view == null) return;

        view.animate()
                .scaleX(0.9f)
                .scaleY(0.9f)
                .setDuration(100)
                .withEndAction(() ->
                        view.animate()
                                .scaleX(1f)
                                .scaleY(1f)
                                .setDuration(100)
                                .start()
                )
                .start();
    }

    public static void animateDialogClose(Dialog dialog) {
        if (dialog == null) return;

        View contentView = dialog.findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.animate()
                    .alpha(0f)
                    .translationY(100f)
                    .setDuration(200)
                    .withEndAction(dialog::dismiss)
                    .start();
        } else {
            dialog.dismiss();
        }
    }


    // create group fragment

    public static void playEnterAnimations(View rootView, Context context) {

        View headerLayout = rootView.findViewById(R.id.headerLayout);
        View groupNameSection = rootView.findViewById(R.id.groupNameSection);
        View searchSection = rootView.findViewById(R.id.searchSection);

        if (headerLayout != null) {
            Animation slideDown = AnimationUtils.loadAnimation(context, R.anim.slide_up);
            headerLayout.startAnimation(slideDown);
        }

        if (groupNameSection != null) {
            Animation fadeIn = AnimationUtils.loadAnimation(context, R.anim.fade_in);
            fadeIn.setStartOffset(100);
            groupNameSection.startAnimation(fadeIn);
        }

        if (searchSection != null) {
            Animation fadeIn2 = AnimationUtils.loadAnimation(context, R.anim.fade_in);
            fadeIn2.setStartOffset(200);
            searchSection.startAnimation(fadeIn2);
        }
    }

    public static void playSelectedMembersShow(View view, Context context) {
        Animation slideUp = AnimationUtils.loadAnimation(context, R.anim.slide_up);
        view.startAnimation(slideUp);
    }

    public static void hideWithSlideDown(View view, Context context) {
        Animation slideDown = AnimationUtils.loadAnimation(context, R.anim.slide_down);

        slideDown.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
                // No-op: No action needed when the animation starts
            }

            @Override
            public void onAnimationEnd(Animation animation) {
                view.setVisibility(View.GONE);
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
                // No-op: This animation does not repeat
            }
        });

        view.startAnimation(slideDown);
    }

    public static void scaleIn(View view) {
        view.setScaleX(0f);
        view.setScaleY(0f);
        view.animate()
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(200)
                .start();
    }


}
