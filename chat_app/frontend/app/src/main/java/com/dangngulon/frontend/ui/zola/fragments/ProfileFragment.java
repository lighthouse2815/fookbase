package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.dangngulon.frontend.databinding.FragmentProfileBinding;
import com.dangngulon.frontend.model.auth.response.UserProfileOverviewResponse;
import com.dangngulon.frontend.ui.zola.ChapAppActivity;
import com.dangngulon.frontend.utils.enums.ProfileType;
import com.dangngulon.frontend.viewmodel.auth.UserProfileViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ProfileFragment extends Fragment {
    private FragmentProfileBinding binding;
    private UserProfileViewModel userProfileViewModel;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ){
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

    private void initViewModel(){
        userProfileViewModel = new ViewModelProvider(this)
                .get(UserProfileViewModel.class);
    }

    private void observeViewModel(){
        userProfileViewModel.getMyProfileResult()
                .observe(getViewLifecycleOwner(), result -> {
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            UserProfileOverviewResponse userProfile = result.getData();
                            updateUI(userProfile);
                            break;

                        case ERROR:
                            showLoading(false);
                            Toast.makeText(getContext(), "lay thong tin that bai", Toast.LENGTH_SHORT).show();
                            break;
                    }
                });
    }

    private void loadUserData() {
        userProfileViewModel.getOverviewProfile();
    }

    private void updateUI(UserProfileOverviewResponse userProfile) {
        if (userProfile != null) {
            binding.profileName.setText(userProfile.getDisplayName());
            binding.phoneNumber.setText(userProfile.getPhoneNumber());
            binding.email.setText(userProfile.getEmail());
            binding.dateOfBirth.setText(userProfile.getBirthDate());
        }
    }

    private void setupClickListeners() {
        binding.profileHeader.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Xem trang cá nhân", Toast.LENGTH_SHORT).show();

            handlOpenProfile("1", "Dang Ngulon", "nickname" ,"avatar url ");
        });

        binding.settingsItem.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Cài đặt", Toast.LENGTH_SHORT).show();
            handleSettings();
        });

        binding.privacyItem.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Quyền riêng tư", Toast.LENGTH_SHORT).show();
            handlePrivacy();
        });

        binding.logoutItem.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Đăng xuất", Toast.LENGTH_SHORT).show();
            handleLogout();
        });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void handlOpenProfile(String userId, String userName, String nickname, String avatarUrl) {
        if (!(requireActivity() instanceof ChapAppActivity)) return;

        ChapAppActivity activity = (ChapAppActivity) requireActivity();

        activity.openUserProfile(
                ProfileType.MY, // hoặc MY
                userId,
                userName,
                nickname
        );
    }

    private void handleLogout() {
        //todo Xử lý đăng xuất
    }

    private void handleSettings() {
        //todo Xử lý cài đặt
    }

    private void handlePrivacy() {
        //todo Xử lý quyền riêng tư
    }

}
