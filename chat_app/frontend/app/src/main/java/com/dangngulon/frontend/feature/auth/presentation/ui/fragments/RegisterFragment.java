package com.dangngulon.frontend.feature.auth.presentation.ui.fragments;

import android.os.Bundle;
import android.content.Intent;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.databinding.FragmentRegisterBinding;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.domain.model.OtpVerificationResult;
import com.dangngulon.frontend.feature.auth.domain.model.RegisterAccountResult;
import com.dangngulon.frontend.feature.auth.presentation.error.AuthErrorMapper;
import com.dangngulon.frontend.core.common.ui.animation.AuthAnimation;
import com.dangngulon.frontend.core.utils.enums.RegisterState;
import com.dangngulon.frontend.core.utils.enums.Status;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.feature.auth.presentation.sharedstate.AuthSharedViewModel;
import com.dangngulon.frontend.feature.auth.presentation.viewmodel.LoginViewModel;
import com.dangngulon.frontend.feature.auth.presentation.viewmodel.RegisterViewModel;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.text.Normalizer;
import java.util.Locale;
import java.util.concurrent.Executor;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class RegisterFragment extends Fragment {
    private static final String CHAT_APP_ACTIVITY_CLASS =
            "com.dangngulon.frontend.feature.zola.presentation.ui.ChatAppActivity";
    private static final String GOOGLE_LOGIN_NOT_CONFIGURED = "Google login chua duoc cau hinh";
    private static final String GOOGLE_LOGIN_FAILED = "Dang nhap Google that bai";
    private static final String GOOGLE_LOGIN_NO_ACCOUNT = "Khong tim thay tai khoan Google";

    private RegisterViewModel registerViewModel;
    private LoginViewModel loginViewModel;
    private FragmentRegisterBinding binding;
    private CredentialManager credentialManager;
    private String googleWebClientId;


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
        initGoogleSignIn();
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
        loginViewModel = new ViewModelProvider(this)
                .get(LoginViewModel.class);
    }

    private void initGoogleSignIn() {
        googleWebClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID == null
                ? ""
                : BuildConfig.GOOGLE_WEB_CLIENT_ID.trim();

        credentialManager = CredentialManager.create(requireContext());
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

        binding.btnGoogle.setOnClickListener(v -> {
            AuthAnimation.animateSocialButton(requireContext(), v);
            handleGoogleAuth();
        });

        CardView[] socialButtons = {
                binding.btnFacebook,
                binding.btnZalo,
        };

        for (CardView btn : socialButtons) {
            btn.setOnClickListener(v -> {
                AuthAnimation.animateSocialButton(requireContext(),v);
                Toast.makeText(requireContext(), "Tinh nang sap ra mat", Toast.LENGTH_SHORT).show();
            });
        }
    }

    private void observeViewModel() {
        observeRegisterViewModel();
        observeSendOtpViewModel();
        observeVerifyOtpViewModel();
        observeGoogleAuthResult();
    }

    private void observeRegisterViewModel() {
        registerViewModel.getRegisterResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<RegisterAccountResult> result = event.getContentIfNotHandled();
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

            Result<OtpVerificationResult> result = event.getContentIfNotHandled();
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

            Result<OtpVerificationResult> result = event.getContentIfNotHandled();
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

    private void observeGoogleAuthResult() {
        loginViewModel.getGoogleAuthResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<GoogleAuthResult> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            handleGoogleAuthSuccess(result.getData());
                            break;

                        case ERROR:
                            showLoading(false);
                            if (isBannedError(result.getMessage())) {
                                navigateToBannedScreen(result.getMessage());
                                break;
                            }

                            UiHelper.showToast(requireContext(), result.getMessage());
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

    private void handleGoogleAuth() {
        if (googleWebClientId == null || googleWebClientId.isBlank()) {
            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_NOT_CONFIGURED);
            return;
        }

        if (credentialManager == null) {
            credentialManager = CredentialManager.create(requireContext());
        }

        CredentialManager manager = credentialManager;
        Executor mainExecutor = ContextCompat.getMainExecutor(requireContext());

        manager.clearCredentialStateAsync(
                new ClearCredentialStateRequest(),
                null,
                mainExecutor,
                new CredentialManagerCallback<>() {
                    @Override
                    public void onResult(Void result) {
                        requestGoogleCredential(manager, mainExecutor);
                    }

                    @Override
                    public void onError(@NonNull ClearCredentialException e) {
                        requestGoogleCredential(manager, mainExecutor);
                    }
                }
        );
    }

    private void requestGoogleCredential(CredentialManager manager, Executor mainExecutor) {
        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setServerClientId(googleWebClientId)
                .setFilterByAuthorizedAccounts(false)
                .setAutoSelectEnabled(false)
                .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();

        manager.getCredentialAsync(
                requireContext(),
                request,
                null,
                mainExecutor,
                new CredentialManagerCallback<>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        String token = extractGoogleIdToken(response);
                        if (token == null || token.isBlank()) {
                            if (isAdded()) {
                                UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
                            }
                            return;
                        }

                        loginViewModel.authWithGoogle(token);
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        if (e instanceof NoCredentialException) {
                            if (isAdded()) {
                                UiHelper.showToast(requireContext(), GOOGLE_LOGIN_NO_ACCOUNT);
                            }
                            return;
                        }

                        if (isAdded()) {
                            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
                        }
                    }
                }
        );
    }

    @Nullable
    private String extractGoogleIdToken(GetCredentialResponse response) {
        Credential credential = response.getCredential();
        if (!(credential instanceof CustomCredential)) {
            return null;
        }

        CustomCredential customCredential = (CustomCredential) credential;
        if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(customCredential.getType())) {
            return null;
        }

        GoogleIdTokenCredential googleIdTokenCredential =
                GoogleIdTokenCredential.createFrom(customCredential.getData());
        return googleIdTokenCredential.getIdToken();
    }

    private void handleGoogleAuthSuccess(@Nullable GoogleAuthResult result) {
        if (result == null) {
            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
            return;
        }

        if (result.getStatus() == Status.BANNED) {
            navigateToBannedScreen("Tai khoan da bi cam");
            return;
        }

        if (result.getAccessToken() == null || result.getAccessToken().isBlank()) {
            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
            return;
        }

        if (!result.isProfileCompleted()) {
            Bundle args = new Bundle();
            args.putString(CompleteProfileFragment.ARG_MODE, CompleteProfileFragment.MODE_GOOGLE);
            args.putString(CompleteProfileFragment.ARG_FIRST_NAME, result.getFirstName());
            args.putString(CompleteProfileFragment.ARG_LAST_NAME, result.getLastName());
            args.putString(CompleteProfileFragment.ARG_EMAIL, result.getEmail());
            args.putString(CompleteProfileFragment.ARG_PHONE_NUMBER, result.getPhoneNumber());
            args.putString(CompleteProfileFragment.ARG_DISPLAY_NAME, result.getDisplayName());
            args.putString(CompleteProfileFragment.ARG_AVATAR_URL, result.getAvatarUrl());
            args.putString(CompleteProfileFragment.ARG_BIRTHDAY, result.getBirthDate());
            args.putString(CompleteProfileFragment.ARG_GENDER, result.getGender());
            NavHostFragment.findNavController(this).navigate(R.id.completeProfileFragment, args);
            return;
        }

        navigateToChatApp();
    }

    private void navigateToChatApp() {
        Intent intent = new Intent();
        intent.setClassName(requireContext(), CHAT_APP_ACTIVITY_CLASS);
        startActivity(intent);
        requireActivity().finish();
    }

    private void navigateToBannedScreen(String message) {
        Bundle args = new Bundle();
        args.putString(BannedAccountFragment.ARG_MESSAGE, message);
        NavHostFragment.findNavController(this).navigate(R.id.bannedAccountFragment, args);
    }

    private boolean isBannedError(String message) {
        String normalized = normalizeForComparison(message);
        if (normalized.isEmpty()) {
            return false;
        }

        return normalized.contains("user_banned")
                || normalized.contains("tai khoan da bi cam")
                || normalized.contains("tai khoan bi cam")
                || normalized.contains("bi cam")
                || normalized.contains("banned");
    }

    private String normalizeForComparison(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .trim()
                .toLowerCase(Locale.ROOT);
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
        switch (AuthErrorMapper.mapRegisterError(message)) {
            case LAST_NAME_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilLastName);
                binding.tilLastName.setError("Vui lòng nhập họ");
                return;
            case FIRST_NAME_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilFirstName);
                binding.tilFirstName.setError("Vui lòng nhập tên");
                return;
            case EMAIL_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilEmail);
                binding.tilEmail.setError("Vui lòng nhập email");
                return;
            case USERNAME_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilPhone);
                binding.tilPhone.setError("Vui lòng nhập số điện thoại");
                return;
            case PASSWORD_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilPassword);
                binding.tilPassword.setError("Vui lòng nhập mật khẩu");
                return;
            case PASSWORD_INVALID:
                AuthAnimation.shake(requireContext(),binding.tilPassword);
                binding.tilPassword.setError("Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, chữ số");
                return;
            case CONFIRM_PASSWORD_EMPTY:
                AuthAnimation.shake(requireContext(),binding.tilConfirmPassword);
                binding.tilConfirmPassword.setError("Vui lòng nhập xác nhận mật khẩu");
                return;
            case PASSWORD_NOT_MATCH:
                AuthAnimation.shake(requireContext(),binding.tilConfirmPassword);
                binding.tilConfirmPassword.setError("Mật khẩu không khớp");
                return;
            case UNKNOWN:
            case OTP_EMPTY:
            default:
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
        }
    }

    private void handleSendOtpError(String message) {
        switch (AuthErrorMapper.mapRegisterError(message)) {
            case EMAIL_EMPTY:
                AuthAnimation.shake(requireContext(), binding.tilEmail);
                binding.tilEmail.setError("Chưa nhập email");
                return;
            case UNKNOWN:
            default:
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
        }
    }

    private void handleVerifyOtpError(String message) {
        switch (AuthErrorMapper.mapRegisterError(message)) {
            case EMAIL_EMPTY:
                AuthAnimation.shake(requireContext(), binding.tilEmail);
                binding.tilEmail.setError("Vui lòng nhập email");
                return;
            case OTP_EMPTY:
                binding.edtOtp.setError("Vui lòng nhập mã OTP");
                AuthAnimation.shake(requireContext(), binding.edtOtp);
                return;
            case UNKNOWN:
            default:
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
        }
    }

}

