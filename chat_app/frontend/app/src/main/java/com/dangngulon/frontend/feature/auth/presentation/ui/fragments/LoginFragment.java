package com.dangngulon.frontend.feature.auth.presentation.ui.fragments;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
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
import com.dangngulon.frontend.feature.auth.presentation.sharedstate.AuthSharedViewModel;
import com.dangngulon.frontend.feature.auth.presentation.viewmodel.LoginViewModel;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class LoginFragment extends Fragment {
    private static final String CHAT_APP_ACTIVITY_CLASS =
            "com.dangngulon.frontend.feature.zola.presentation.ui.ChatAppActivity";
    private static final String GOOGLE_LOGIN_NOT_CONFIGURED = "Google login chua duoc cau hinh";
    private static final String GOOGLE_LOGIN_FAILED = "Dang nhap Google that bai";

    private LoginViewModel loginViewModel;
    private AuthSharedViewModel authSharedViewModel;
    private FragmentLoginBinding binding;
    private GoogleSignInClient googleSignInClient;
    private final ActivityResultLauncher<Intent> googleSignInLauncher =
            registerForActivityResult(
                    new ActivityResultContracts.StartActivityForResult(),
                    result -> {
                        if (result.getResultCode() != Activity.RESULT_OK) {
                            return;
                        }

                        Intent data = result.getData();
                        if (data == null) {
                            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
                            return;
                        }

                        try {
                            GoogleSignInAccount account = GoogleSignIn
                                    .getSignedInAccountFromIntent(data)
                                    .getResult(ApiException.class);
                            String token = account != null ? account.getIdToken() : null;
                            if (token == null || token.trim().isEmpty()) {
                                UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
                                return;
                            }

                            loginViewModel.authWithGoogle(token);
                        } catch (ApiException exception) {
                            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_FAILED);
                        }
                    }
            );



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
        String webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID == null
                ? ""
                : BuildConfig.GOOGLE_WEB_CLIENT_ID.trim();

        if (webClientId.isEmpty()) {
            googleSignInClient = null;
            return;
        }

        GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(webClientId)
                .build();
        googleSignInClient = GoogleSignIn.getClient(requireContext(), options);
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
            handelLoginGoogle();
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
                            navigateToChatApp();
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
                            navigateToChatApp();
                            break;

                        case ERROR:
                            showLoading(false);
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

    private void handleLoginError(String message) {
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

    private void handelLoginGoogle(){
        GoogleSignInClient signInClient = googleSignInClient;
        if (signInClient == null) {
            UiHelper.showToast(requireContext(), GOOGLE_LOGIN_NOT_CONFIGURED);
            return;
        }

        // Sign out cached account first so Google always shows account chooser.
        signInClient.signOut()
                .addOnCompleteListener(task -> {
                    if (!isAdded()) {
                        return;
                    }
                    googleSignInLauncher.launch(signInClient.getSignInIntent());
                });
    }
}


