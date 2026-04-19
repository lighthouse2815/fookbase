package com.dangngulon.frontend.core.common.ui.animation;

import android.content.Context;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;

import androidx.annotation.NonNull;

import com.dangngulon.frontend.R;

public final class AuthAnimation {

    private AuthAnimation() {}


    // Login..........................
    public static void playEnterLoginAnimation(
            @NonNull Context context,
            @NonNull View imgLogo,
            @NonNull View tvWelcome,
            @NonNull View tvSubtitle,
            @NonNull View cardLogin,
            @NonNull View socialLayout
    ) {
        clearAnimations(imgLogo, tvWelcome, tvSubtitle, cardLogin, socialLayout);


        Animation bounce = anim(context, R.anim.bounce);
        imgLogo.startAnimation(bounce);

        Animation fadeIn1 = anim(context, R.anim.fade_in);
        fadeIn1.setStartOffset(300);
        tvWelcome.startAnimation(fadeIn1);

        Animation fadeIn2 = anim(context, R.anim.fade_in);
        fadeIn2.setStartOffset(500);
        tvSubtitle.startAnimation(fadeIn2);

        Animation slideUp = anim(context, R.anim.slide_up);
        slideUp.setStartOffset(400);
        cardLogin.startAnimation(slideUp);

        Animation scaleUp = anim(context, R.anim.scale_up);
        scaleUp.setStartOffset(700);
        socialLayout.startAnimation(scaleUp);
    }


    // Register..........................
    public static void playEnterRegisterAnimations(
            @NonNull Context context,
            @NonNull View imgLogo,
            @NonNull View tvTitle,
            @NonNull View tvSubtitle,
            @NonNull View cardRegister,
            @NonNull View layoutSocialRegister
    ) {
        clearAnimations(imgLogo, tvTitle, tvSubtitle, cardRegister, layoutSocialRegister);

        imgLogo.startAnimation(anim(context, R.anim.bounce));

        Animation fadeIn = anim(context, R.anim.fade_in);
        tvTitle.startAnimation(fadeIn);
        tvSubtitle.startAnimation(fadeIn);

        cardRegister.startAnimation(anim(context, R.anim.slide_up));

        layoutSocialRegister.startAnimation(anim(context, R.anim.scale_up));
    }


    // Forgot Password..........................
    public static void playEnterForgotPasswordAnimations(
            @NonNull Context context,
            @NonNull View imgLock,
            @NonNull View tvTitle,
            @NonNull View tvSubtitle,
            @NonNull View cardForgot
    ) {
        clearAnimations(imgLock, tvTitle, tvSubtitle, cardForgot);

        Animation bounce = anim(context, R.anim.bounce);
        imgLock.startAnimation(bounce);

        Animation fadeIn = anim(context, R.anim.fade_in);
        tvTitle.startAnimation(fadeIn);
        tvSubtitle.startAnimation(fadeIn);

        Animation slideUp = anim(context, R.anim.slide_up);
        cardForgot.startAnimation(slideUp);
    }





    // Animations dung chung..........................
    public static void animateButtonClick(
            @NonNull Context context,
            @NonNull View view
    ) {
        clearAnimations(view);

        Animation press = anim(context, R.anim.button_press);
        Animation release = anim(context, R.anim.button_release);

        press.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {
                // No-op: No action needed when the press animation starts
            }

            @Override
            public void onAnimationEnd(Animation animation) {
                view.startAnimation(release);
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
                // No-op: This animation does not repeat
            }
        });

        view.startAnimation(press);
    }

    public static void shake(
            @NonNull Context context,
            @NonNull View view
    ) {
        clearAnimations(view);
        view.startAnimation(anim(context, R.anim.shake));
    }

    public static void animateSocialButton(
            @NonNull Context context,
            @NonNull View view
    ) {
        clearAnimations(view);
        Animation scale = anim(context, R.anim.scale_up);
        view.startAnimation(scale);
    }



    // Animation helper..........................
    private static Animation anim(@NonNull Context c, int res) {
        return AnimationUtils.loadAnimation(c, res);
    }

    private static void clearAnimations(@NonNull View... views) {
        for (View v : views) {
            if (v != null) {
                v.clearAnimation();
            }
        }
    }

}
