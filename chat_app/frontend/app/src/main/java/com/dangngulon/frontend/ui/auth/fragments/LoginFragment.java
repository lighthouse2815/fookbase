package com.dangngulon.frontend.ui.auth.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentLoginBinding;
import com.dangngulon.frontend.domain.common.errors.LoginError;
import com.dangngulon.frontend.model.auth.response.LoginResponse;
import com.dangngulon.frontend.ui.zola.ChapAppActivity;
import com.dangngulon.frontend.ui.common.animation.AuthAnimation;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.common.sharedstate.AuthSharedViewModel;
import com.dangngulon.frontend.viewmodel.auth.LoginViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class LoginFragment extends Fragment {
    private LoginViewModel loginViewModel;
    private AuthSharedViewModel authSharedViewModel;
    private FragmentLoginBinding binding;



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
        initEvents();
        observeViewModel();

        binding.etUsername.setText("0376372825");
        binding.etPassword.setText("123456Aa");
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
    }

    private void observeLoginResult() {
        loginViewModel.getLoginResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<LoginResponse> result = event.getContentIfNotHandled();
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

                    Result<?> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            break;

                        case ERROR:
                            showLoading(false);
                            UiHelper.showToast(requireContext(),result.getMessage());
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
        startActivity(
                new Intent(requireContext(), ChapAppActivity.class)
        );
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
        if (LoginError.USERNAME_EMPTY.name().equals(message)) {
            binding.tilUsername.setError("Vui lòng nhập tài khoản");
            AuthAnimation.shake(requireContext(), binding.tilUsername);
            return;
        }

        if (LoginError.PASSWORD_EMPTY.name().equals(message)) {
            binding.tilPassword.setError("Vui lòng nhập mật khẩu");
            AuthAnimation.shake(requireContext(), binding.tilPassword);
            return;
        }

        UiHelper.showToast(requireContext(), message);
    }

    private void handelLoginGoogle(){
        // TODO : de lam sau
    }
}

