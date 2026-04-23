package com.dangngulon.frontend.feature.profile.presentation.ui.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.databinding.FragmentProfileBinding;
import com.dangngulon.frontend.feature.profile.domain.model.UserProfileOverview;
import com.dangngulon.frontend.core.utils.enums.ProfileType;
import com.dangngulon.frontend.feature.profile.presentation.viewmodel.UserProfileViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ProfileFragment extends Fragment {
    private static final String AUTH_ACTIVITY_CLASS =
            "com.dangngulon.frontend.feature.auth.presentation.ui.AuthActivity";

    private FragmentProfileBinding binding;
    private UserProfileViewModel userProfileViewModel;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        loadUserData();
        setupClickListeners();
        observeViewModel();
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initViewModel();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        userProfileViewModel = new ViewModelProvider(this)
                .get(UserProfileViewModel.class);
    }

    private void observeViewModel() {
        userProfileViewModel.getMyProfileResult()
                .observe(getViewLifecycleOwner(), result -> {
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            UserProfileOverview userProfile = result.getData();
                            updateUI(userProfile);
                            break;

                        case ERROR:
                            showLoading(false);
                            Toast.makeText(getContext(), "Lay thong tin that bai", Toast.LENGTH_SHORT).show();
                            break;
                    }
                });

        observeLogoutResult();
    }

    private void observeLogoutResult() {
        userProfileViewModel.getLogoutResult().observe(getViewLifecycleOwner(), event -> {
            if (event == null) return;

            Result<Void> result = event.getContentIfNotHandled();
            if (result == null) return;

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    navigateToAuth();
                    break;

                case ERROR:
                    showLoading(false);
                    navigateToAuth();
                    break;
            }
        });
    }

    private void loadUserData() {
        userProfileViewModel.getOverviewProfile();
    }

    private void updateUI(UserProfileOverview userProfile) {
        if (userProfile != null) {
            binding.profileName.setText(userProfile.getDisplayName());
            binding.phoneNumber.setText(userProfile.getPhoneNumber());
            binding.email.setText(userProfile.getEmail());
            binding.dateOfBirth.setText(userProfile.getBirthDate());
        }
    }

    private void setupClickListeners() {
        binding.profileHeader.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Xem trang ca nhan", Toast.LENGTH_SHORT).show();

            String userId = userProfileViewModel.getCurrentUserId();
            String displayName = binding.profileName.getText() != null
                    ? binding.profileName.getText().toString()
                    : userProfileViewModel.getCurrentDisplayName();

            if (displayName == null || displayName.trim().isEmpty()) {
                displayName = "Me";
            }

            if (userId == null || userId.trim().isEmpty()) {
                Toast.makeText(getContext(), "Khong tim thay user id", Toast.LENGTH_SHORT).show();
                return;
            }

            handleOpenProfile(userId, displayName, displayName);
        });

        binding.settingsItem.setOnClickListener(v -> handleSettings());

        binding.privacyItem.setOnClickListener(v -> handlePrivacy());

        binding.logoutItem.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Dang xuat", Toast.LENGTH_SHORT).show();
            handleLogout();
        });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void handleOpenProfile(String userId, String userName, String nickname) {
        Bundle args = new Bundle();
        args.putString("profileType", ProfileType.MY.name());
        args.putString("userId", userId);
        args.putString("userName", userName);
        args.putString("nickname", nickname);

        NavHostFragment.findNavController(this)
                .navigate(R.id.action_global_userProfile, args);
    }

    private void handleLogout() {
        userProfileViewModel.logout();
    }

    private void handleSettings() {
        Toast.makeText(getContext(), getString(R.string.settings_coming_soon), Toast.LENGTH_SHORT).show();
    }

    private void handlePrivacy() {
        Toast.makeText(getContext(), getString(R.string.settings_coming_soon), Toast.LENGTH_SHORT).show();
    }

    private void navigateToAuth() {
        Intent intent = new Intent();
        intent.setClassName(requireContext(), AUTH_ACTIVITY_CLASS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        requireActivity().finish();
    }
}
