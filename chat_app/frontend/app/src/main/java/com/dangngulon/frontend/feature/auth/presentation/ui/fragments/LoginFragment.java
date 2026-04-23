package com.dangngulon.frontend.feature.auth.presentation.ui.fragments;

import android.os.Bundle;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
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
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.BuildConfig;
import com.dangngulon.frontend.databinding.FragmentLoginBinding;
import com.dangngulon.frontend.feature.auth.domain.model.AuthSession;
import com.dangngulon.frontend.feature.auth.domain.model.GoogleAuthResult;
import com.dangngulon.frontend.feature.auth.presentation.error.AuthErrorMapper;
import com.dangngulon.frontend.core.common.ui.animation.AuthAnimation;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.core.utils.enums.Status;
import com.dangngulon.frontend.feature.auth.presentation.sharedstate.AuthSharedViewModel;
import com.dangngulon.frontend.feature.auth.presentation.viewmodel.LoginViewModel;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.text.Normalizer;
import java.util.Locale;
import java.util.concurrent.Executor;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class LoginFragment extends Fragment {
    private static final String CHAT_APP_ACTIVITY_CLASS =
            "com.dangngulon.frontend.feature.zola.presentation.ui.ChatAppActivity";
    private static final String GOOGLE_LOGIN_NOT_CONFIGURED = "Google login chua duoc cau hinh";
    private static final String GOOGLE_LOGIN_FAILED = "Dang nhap Google that bai";
    private static final String GOOGLE_LOGIN_NO_ACCOUNT = "Khong tim thay tai khoan Google";

    private LoginViewModel loginViewModel;
    private AuthSharedViewModel authSharedViewModel;
    private FragmentLoginBinding binding;
    private CredentialManager credentialManager;
    private String googleWebClientId;



    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentLoginBinding.inflate(inflater, container, false);
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
        loginViewModel.restoreSessionIfAvailable();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        loginViewModel = new ViewModelProvider(this)
                .get(LoginViewModel.class);

        authSharedViewModel = new ViewModelProvider(requireActivity())
                .get(AuthSharedViewModel.class);
    }

    private void initGoogleSignIn() {
        googleWebClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID == null
                ? ""
                : BuildConfig.GOOGLE_WEB_CLIENT_ID.trim();

        credentialManager = CredentialManager.create(requireContext());
    }


    private void initEvents() {
        binding.btnLogin.setOnClickListener(v -> {
            AuthAnimation.animateButtonClick(requireContext(), v);
            handleLogin();
        });

        binding.tvForgotPassword.setOnClickListener(v ->
                NavHostFragment.findNavController(this)
                        .navigate(R.id.action_login_to_forgot)
        );

        binding.tvRegister.setOnClickListener(v ->
                NavHostFragment.findNavController(this)
                        .navigate(R.id.action_login_to_register)
        );

        binding.btnGoogle.setOnClickListener(v -> {
            AuthAnimation.animateSocialButton(requireContext(), v);
            handleLoginWithGoogle();
        });
    }

    private void observeViewModel() {
        observeLoginResult();
        observeRegisterUsername();
        observeGoogleAuthResult();
        observeRestoreSessionResult();
    }

    private void observeLoginResult() {
        loginViewModel.getLoginResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<AuthSession> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            handleLocalAuthSuccess(result.getData());
                            break;

                        case ERROR:
                            showLoading(false);
                            handleLoginError(result.getMessage());
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

                            UiHelper.showToast(requireContext(),result.getMessage());
                            break;
                    }

                });
    }

    private void observeRestoreSessionResult() {
        loginViewModel.getRestoreSessionResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<Boolean> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            if (Boolean.TRUE.equals(result.getData())) {
                                navigateToChatApp();
                            }
                            break;

                        case ERROR:
                            showLoading(false);
                            break;
                    }
                });
    }

    private void observeRegisterUsername() {
        authSharedViewModel.getRegisterUsername()
                .observe(getViewLifecycleOwner(), username -> {
                    if (username == null) return;

                    binding.etUsername.setText(username);
                    binding.etPassword.setText("");
                });
    }

    private void navigateToChatApp(){
        Intent intent = new Intent();
        intent.setClassName(requireContext(), CHAT_APP_ACTIVITY_CLASS);
        startActivity(intent);
        requireActivity().finish();
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        binding.btnLogin.setEnabled(!isLoading);
        binding.btnGoogle.setEnabled(!isLoading);
        binding.btnFacebook.setEnabled(!isLoading);
        binding.btnZalo.setEnabled(!isLoading);
        binding.btnApple.setEnabled(!isLoading);
    }

    private void playEnterAnimation() {
        AuthAnimation.playEnterLoginAnimation(
                requireContext(),
                binding.imgLogo,
                binding.tvWelcome,
                binding.tvSubtitle,
                binding.cardLogin,
                binding.layoutSocialLogin
        );
    }

    private void handleLogin() {
        binding.tilUsername.setError(null);
        binding.tilPassword.setError(null);

        String username = UiHelper.getText(binding.etUsername);
        String password = UiHelper.getText(binding.etPassword);

        loginViewModel.login(username, password);
    }

    private void handleLocalAuthSuccess(@Nullable AuthSession session) {
        if (session == null) {
            UiHelper.showToast(requireContext(), "Dang nhap that bai");
            return;
        }

        if (session.getStatus() == Status.BANNED) {
            navigateToBannedScreen("Tai khoan da bi cam");
            return;
        }

        if (session.getStatus() == Status.INACTIVE || session.getAccessToken() == null || session.getAccessToken().isBlank()) {
            UiHelper.showToast(requireContext(), "Tai khoan chua duoc kich hoat");
            return;
        }

        if (!session.isProfileCompleted()) {
            Bundle args = new Bundle();
            args.putString(CompleteProfileFragment.ARG_MODE, CompleteProfileFragment.MODE_LOCAL);
            args.putString(CompleteProfileFragment.ARG_DISPLAY_NAME, session.getDisplayName());
            args.putString(CompleteProfileFragment.ARG_AVATAR_URL, session.getAvatarUrl());
            NavHostFragment.findNavController(this).navigate(R.id.completeProfileFragment, args);
            return;
        }

        navigateToChatApp();
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

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .trim()
                .toLowerCase(Locale.ROOT);

        return normalized;
    }

    private void handleLoginError(String message) {
        if (isBannedError(message)) {
            navigateToBannedScreen(message);
            return;
        }

        switch (AuthErrorMapper.mapLoginError(message)) {
            case USERNAME_EMPTY:
                binding.tilUsername.setError("Vui lòng nhập tài khoản");
                AuthAnimation.shake(requireContext(), binding.tilUsername);
                return;
            case PASSWORD_EMPTY:
                binding.tilPassword.setError("Vui lòng nhập mật khẩu");
                AuthAnimation.shake(requireContext(), binding.tilPassword);
                return;
            case UNKNOWN:
            default:
                UiHelper.showToast(requireContext(), message);
        }
    }

    private void handleLoginWithGoogle() {
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
}


