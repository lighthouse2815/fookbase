package com.dangngulon.frontend.ui.auth.fragments;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentForgotPasswordBinding;
import com.dangngulon.frontend.domain.common.errors.ForgotPasswordError;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.error.MessageResponse;
import com.dangngulon.frontend.ui.common.animation.AuthAnimation;
import com.dangngulon.frontend.utils.enums.ForgotPasswordState;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.auth.ForgotPasswordViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ForgotPasswordFragment extends Fragment {
    private ForgotPasswordViewModel forgotPasswordViewModel;
    private FragmentForgotPasswordBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentForgotPasswordBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        UiHelper.setupBottomNavigation(
                this,
                binding.main,
                R.color.background_dark
        );

        if (savedInstanceState == null) {
            playEnterAnimation();
        }

        initViewModel();
        initEvents();
        observeViewModel();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        forgotPasswordViewModel = new ViewModelProvider(requireActivity())
                .get(ForgotPasswordViewModel.class);
    }

    private void initEvents() {
        binding.btnBack.setOnClickListener(v ->
                NavHostFragment.findNavController(this).navigateUp()
        );

        binding.btnBackToForm.setOnClickListener(v ->
                showCard(ForgotPasswordState.FORM)
        );

        binding.btnBackToOtp.setOnClickListener(v ->
                showCard(ForgotPasswordState.OTP)
        );


        binding.btnSendReset.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(),v);
            handleSendReset();
        });

        binding.btnVerifyOtp.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(),v);
            handleVerifyOTP();
        });

        binding.btnResetPassword.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(), v);
            handleResetPassword();
        });

        binding.tvLogin.setOnClickListener(v ->
                NavHostFragment.findNavController(this).navigateUp()
        );
    }

    private void observeViewModel() {
        observeSendOTPViewModel();
        observeVerifyOTPViewModel();
        observeResetPasswordViewModel();
    }

    private void observeSendOTPViewModel() {
        forgotPasswordViewModel.getSendResetPasswordOtpWhenNotLoginResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<OtpVerifyResponse> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {

                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            showCard(ForgotPasswordState.OTP);
                            break;

                        case ERROR:
                            showLoading(false);
                            handleSendResetError(result.getMessage());
                            break;
                    }
                });
    }


    private void observeVerifyOTPViewModel() {
        forgotPasswordViewModel.getVerifyOtpResetPasswordWhenNotLoginResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<OtpVerifyResponse> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            showCard(ForgotPasswordState.RESET);
                            forgotPasswordViewModel.setResetPasswordToken(result.data.getResult());
                            break;

                        case ERROR:
                            showLoading(false);
                            handleVerifyOTPError(result.getMessage());
                            break;
                    }
                });
    }

    private void observeResetPasswordViewModel() {
        forgotPasswordViewModel.getResetPasswordResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<MessageResponse> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            showCard(ForgotPasswordState.SUCCESS);
                            break;

                        case ERROR:
                            showLoading(false);
                            handleResetPasswordError(result.getMessage());
                            break;
                    }
                });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        binding.btnBack.setEnabled(!isLoading);
    }

    private void playEnterAnimation() {
        AuthAnimation.playEnterForgotPasswordAnimations(
                requireContext(),
                binding.imgLock,
                binding.tvTitle,
                binding.tvSubtitle,
                binding.cardForgot
        );
    }

    private void showCard(@Nullable ForgotPasswordState stage) {
        binding.cardOtp.setVisibility(View.GONE);
        binding.cardSuccess.setVisibility(View.GONE);
        binding.cardResetPassword.setVisibility(View.GONE);
        binding.cardForgot.setVisibility(View.GONE);


        if (stage == null) return;

        switch (stage) {
            case OTP:
                binding.cardOtp.setVisibility(View.VISIBLE);
                break;

            case RESET:
                binding.cardResetPassword.setVisibility(View.VISIBLE);
                break;

            case SUCCESS:
                binding.cardSuccess.setVisibility(View.VISIBLE);
                break;

            case FORM:
                binding.cardForgot.setVisibility(View.VISIBLE);
                break;

            default:
                Log.w("AuthUI", "Unknown stage: " + stage);
                break;
        }
    }

    private void handleSendReset() {
        binding.tilEmail.setError(null);

        String email = UiHelper.getText(binding.etEmail);

        forgotPasswordViewModel.sendResetPasswordOtpWhenNotLogin(
                email
        );
    }

    private void handleVerifyOTP() {
        binding.tilOtp.setError(null);

        String email = UiHelper.getText(binding.etEmail);
        String otp = UiHelper.getText(binding.edtOtp);

        forgotPasswordViewModel.verifyOtpResetPasswordWhenNotLogin(
                email, otp
        );
    }

    private void handleResetPassword() {
        binding.tilNewPassword.setError(null);
        binding.tilConfirmPassword.setError(null);

        String newPassword = UiHelper.getText(binding.edtNewPassword);
        String confirmPassword = UiHelper.getText(binding.edtConfirmPassword);

        String token = forgotPasswordViewModel.getResetPasswordToken();

        forgotPasswordViewModel.resetPassword(
                token,
                newPassword,
                confirmPassword
        );
    }

    private void handleSendResetError(String message) {
        if (ForgotPasswordError.EMAIL_EMPTY.name().equals(message)) {
            binding.tilEmail.setError("Vui lòng nhập email của bạn");
            AuthAnimation.shake(requireContext(), binding.tilEmail);
            return;
        }

        UiHelper.showToast(requireContext(), message);
    }

    private void handleVerifyOTPError(String message) {
        if (ForgotPasswordError.OTP_EMPTY.name().equals(message)) {
            binding.tilOtp.setError("Vui lòng nhập mã otp");
            AuthAnimation.shake(requireContext(), binding.tilOtp);
            return;
        }

        UiHelper.showToast(requireContext(), message);
    }


    private void handleResetPasswordError(String message){
        if (ForgotPasswordError.PASSWORD_EMPTY.name().equals(message)) {
            binding.tilNewPassword.setError("Vui lòng nhập mật khẩu mới");
            AuthAnimation.shake(requireContext(), binding.tilNewPassword);
            return;
        }

        if (ForgotPasswordError.PASSWORD_INVALID.name().equals(message)) {
            binding.tilNewPassword.setError("Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ số");
            AuthAnimation.shake(requireContext(), binding.tilNewPassword);
            return;
        }

        if (ForgotPasswordError.CONFIRM_PASSWORD_EMPTY.name().equals(message)) {
            binding.tilConfirmPassword.setError("Vui lòng nhập xác nhận mật khẩu");
            AuthAnimation.shake(requireContext(), binding.tilConfirmPassword);
            return;
        }

        if (ForgotPasswordError.PASSWORD_NOT_MATCH.name().equals(message)) {
            binding.tilConfirmPassword.setError("Mật khẩu không khớp");
            AuthAnimation.shake(requireContext(), binding.tilConfirmPassword);
            return;
        }

        if (ForgotPasswordError.TOKEN_INVALID.name().equals(message)) {
            UiHelper.showToast(requireContext(),"Token không hợp lệ");
            return;
        }

        UiHelper.showToast(requireContext(), message);
    }

}

