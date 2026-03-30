package com.dangngulon.frontend.ui.auth.fragments;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentRegisterBinding;
import com.dangngulon.frontend.model.auth.response.OtpVerifyResponse;
import com.dangngulon.frontend.model.auth.response.RegisterResponse;
import com.dangngulon.frontend.ui.common.animation.AuthAnimation;
import com.dangngulon.frontend.utils.enums.RegisterState;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.sharedstate.AuthSharedViewModel;
import com.dangngulon.frontend.viewmodel.auth.RegisterViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class RegisterFragment extends Fragment {
    private RegisterViewModel registerViewModel;
    private FragmentRegisterBinding binding;


    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            ViewGroup container,
            Bundle savedInstanceState
    ) {
        binding = FragmentRegisterBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        UiHelper.setupBottomNavigation(
                this,
                binding.mainScrollView,
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
        registerViewModel = new ViewModelProvider(this)
                .get(RegisterViewModel.class);
    }


    private void initEvents() {
        NavController navController =
                NavHostFragment.findNavController(this);

        binding.btnBack.setOnClickListener(v ->
                navController.navigateUp()
        );

        binding.btnRegister.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(),v);
            handleRegister();
        });

        binding.btnVerifyOtp.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(), v);
            handleVerifyOtp();
        });

        binding.btnBackToLogin.setOnClickListener(v ->
                navController.navigateUp()
        );


        binding.tvLogin.setOnClickListener(v ->
                navController.navigateUp()
        );

        CardView[] socialButtons = {
                binding.btnGoogle,
                binding.btnFacebook,
                binding.btnZalo,
        };

        for (CardView btn : socialButtons) {
            btn.setOnClickListener(v -> {
                AuthAnimation.animateSocialButton(requireContext(),v);

                String provider = String.valueOf(btn.getTag());

                Toast.makeText(
                        requireContext(),
                        "Đăng kí bằng " + provider,
                        Toast.LENGTH_SHORT
                ).show();
            });
        }
    }

    private void observeViewModel() {
        observeRegisterViewModel();
        observeSendOtpViewModel();
        observeVerifyOtpViewModel();
    }

    private void observeRegisterViewModel() {
        registerViewModel.getRegisterResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<RegisterResponse> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            handleSendOtp();

                            AuthSharedViewModel authSharedViewModel =
                                    new ViewModelProvider(requireActivity()).get(AuthSharedViewModel.class);
                            authSharedViewModel.setRegisterUsername(result.data.getUsername());
                            break;

                        case ERROR:
                            showLoading(false);
                            handleRegisterError(result.getMessage());
                            break;
                    }
                });
    }

    private void observeSendOtpViewModel() {
        registerViewModel.getSendVerifyEmailOtpWhenNotLoginResult()
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
                    showCard(RegisterState.OTP);
                    break;
                case ERROR:
                    showLoading(false);
                    handleSendOtpError(result.getMessage());
                    break;
            }
        });
    }

    private void observeVerifyOtpViewModel() {
        registerViewModel.getVerifyOtpEmailWhenNotLoginResult()
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
                    showCard(RegisterState.SUCCESS);
                    break;

                case ERROR:
                    showLoading(false);
                    handleVerifyOtpError(result.getMessage());
                    break;
            }
        });
    }


    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        binding.btnRegister.setEnabled(!isLoading);
        binding.btnBack.setEnabled(!isLoading);
        binding.btnGoogle.setEnabled(!isLoading);
        binding.btnFacebook.setEnabled(!isLoading);
        binding.btnZalo.setEnabled(!isLoading);
    }

    private void playEnterAnimation() {
        AuthAnimation.playEnterRegisterAnimations(
                requireContext(),
                binding.imgLogo,
                binding.tvTitle,
                binding.tvSubtitle,
                binding.cardRegister,
                binding.layoutSocialRegister
        );
    }

    private void showCard(@Nullable RegisterState stage) {
        binding.cardRegister.setVisibility(View.GONE);
        binding.cardOtp.setVisibility(View.GONE);
        binding.cardSuccess.setVisibility(View.GONE);

        if (stage == null) return;

        switch (stage) {
            case OTP:
                binding.cardOtp.setVisibility(View.VISIBLE);
                break;
            case SUCCESS:
                binding.cardSuccess.setVisibility(View.VISIBLE);
                break;
            default:
                binding.cardRegister.setVisibility(View.VISIBLE);
                Log.w("RegisterUI", "Unknown stage: " + stage);
                break;
        }
    }

    private void handleSendOtp() {
        registerViewModel.sendVerifyEmailOtpWhenNotLogin(
                UiHelper.getText(binding.etEmail)
        );
    }

    private void handleVerifyOtp() {
        binding.edtOtp.setError(null);

        registerViewModel.verifyOtpEmailWhenNotLogin(
            UiHelper.getText(binding.etEmail),
            UiHelper.getText(binding.edtOtp)
        );
    }

    private void handleRegister() {
        clearErrors();

        if (!binding.cbTerms.isChecked()) {
            AuthAnimation.shake(requireContext(),binding.cbTerms);
            binding.cbTerms.setError("Vui lòng đồng ý điều khoản");
            return;
        }

        registerViewModel.register(
                UiHelper.getText(binding.etPhone),
                UiHelper.getText(binding.etPassword),
                UiHelper.getText(binding.etConfirmPassword),
                UiHelper.getText(binding.etEmail),
                UiHelper.getText(binding.etLastName),
                UiHelper.getText(binding.etFirstName)
        );
    }

    private void clearErrors() {
        binding.tilLastName.setError(null);
        binding.tilFirstName.setError(null);
        binding.tilEmail.setError(null);
        binding.tilPhone.setError(null);
        binding.tilPassword.setError(null);
        binding.tilConfirmPassword.setError(null);
        binding.cbTerms.setError(null);
    }

    private void handleRegisterError(String message) {
        if (com.dangngulon.frontend.domain.common.errors.RegisterError.LAST_NAME_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilLastName);
            binding.tilLastName.setError("Vui lòng nhập họ");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.FIRST_NAME_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilFirstName);
            binding.tilFirstName.setError("Vui lòng nhập tên");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.EMAIL_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilEmail);
            binding.tilEmail.setError("Vui lòng nhập email");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.USERNAME_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilPhone);
            binding.tilPhone.setError("Vui lòng nhập số điện thoại");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.PASSWORD_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilPassword);
            binding.tilPassword.setError("Vui lòng nhập mật khẩu");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.PASSWORD_INVALID.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilPassword);
            binding.tilPassword.setError("Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ số");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.CONFIRM_PASSWORD_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilConfirmPassword);
            binding.tilConfirmPassword.setError("Vui lòng nhập xác nhận mật khẩu");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.PASSWORD_NOT_MATCH.name().equals(message)) {
            AuthAnimation.shake(requireContext(),binding.tilConfirmPassword);
            binding.tilConfirmPassword.setError("Mật khẩu không khớp");
            return;
        }

        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
    }

    private void handleSendOtpError(String message) {
        if (com.dangngulon.frontend.domain.common.errors.RegisterError.EMAIL_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(), binding.tilEmail);
            binding.tilEmail.setError("Chưa nhập email");
            return;
        }

        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
    }

    private void handleVerifyOtpError(String message) {
        if (com.dangngulon.frontend.domain.common.errors.RegisterError.EMAIL_EMPTY.name().equals(message)) {
            AuthAnimation.shake(requireContext(), binding.tilEmail);
            binding.tilEmail.setError("Vui lòng nhập email");
            return;
        }

        if (com.dangngulon.frontend.domain.common.errors.RegisterError.OTP_EMPTY.name().equals(message)) {
            binding.edtOtp.setError("Vui lòng nhập mã OTP");
            AuthAnimation.shake(requireContext(), binding.edtOtp);
            return;
        }

        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
    }

}
