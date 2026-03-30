package com.dangngulon.frontend.ui.zola.fragments;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;


import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentAddFriendBinding;
import com.dangngulon.frontend.model.zola.response.FriendshipResponse;
import com.dangngulon.frontend.ui.common.animation.AuthAnimation;
import com.dangngulon.frontend.ui.common.animation.ChatAppAnimation;
import com.dangngulon.frontend.domain.common.errors.UserProfileError;
import com.dangngulon.frontend.utils.data.AuthManager;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.utils.enums.FriendshipStatus;
import com.dangngulon.frontend.viewmodel.zola.AddFriendViewModel;
import com.dangngulon.frontend.viewmodel.auth.UserProfileViewModel;
import com.dangngulon.frontend.model.auth.response.UserProfileResponse;
import com.dangngulon.frontend.model.auth.response.UserProfileSearchResponse;
import com.dangngulon.frontend.utils.others.Result;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class AddFriendFragment extends Fragment {
    private FragmentAddFriendBinding binding;
    private AddFriendViewModel addFriendViewModel;
    private UserProfileViewModel userProfileViewModel;
    @Inject
    AuthManager authManager;

    private String userId;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentAddFriendBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViewModel();
        setupClickListeners();
        setupAnimations();
        observeViewModel();
        setupFragmentResultListener();
        generateQr();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel(){
        addFriendViewModel = new ViewModelProvider(this)
                .get(AddFriendViewModel.class);
        userProfileViewModel = new ViewModelProvider(this)
                .get(UserProfileViewModel.class);
    }

    private void observeViewModel(){
        observeSearchByPhoneNumber();
        observeQrResult();
        observeUserProfileResult();
        observeRenderQr();
        observeAddFriendResult();
    }

    private void observeAddFriendResult(){
        addFriendViewModel.getSendFriendRequestResult().observe(getViewLifecycleOwner(), event -> {
            Result<FriendshipResponse> result = event.getContentIfNotHandled();

            if (result != null) {
                switch (result.getStatus()) {
                    case LOADING:
                        break;

                    case SUCCESS:
                        binding.btnAddFriend.setText("Đã gửi");
                        binding.btnAddFriend.setEnabled(false);
                        break;

                    case ERROR:
                        showLoading(false);
                        handleSearchError(result.getMessage());
                        break;
                }

            }
        } );
    }

    private void observeSearchByPhoneNumber(){
        userProfileViewModel.getSearchProfileResult().observe(getViewLifecycleOwner(), event -> {
            Result<UserProfileSearchResponse> result = event.getContentIfNotHandled();

            if (result != null) {
                switch (result.getStatus()) {
                    case LOADING:
                        showLoading(true);
                        break;

                    case SUCCESS:
                        showLoading(false);
                        UserProfileSearchResponse userProfile = result.getData();
                        if (userProfile != null) {
                            showSearchResult(
                                    userProfile.getAvatarUrl(),
                                    userProfile.getDisplayName(),
                                    userProfile.getPhoneNumber(),
                                    userProfile.getStatus()
                            );

                            userId = userProfile.getUserId();
                        }
                        break;

                    case ERROR:
                        showLoading(false);
                        handleSearchError(result.getMessage());
                        hideSearchResult();
                        break;
                }
            }
        });
    }

    private void observeQrResult(){
        addFriendViewModel.userId.observe(getViewLifecycleOwner(), event -> {
            userId = event.getContentIfNotHandled();
            if (userId != null) {
                handleGetUserProfile(userId);
            }
        });

        addFriendViewModel.errorQr.observe(getViewLifecycleOwner(), event -> {
            String error = event.getContentIfNotHandled();
            if (error != null) {
                UiHelper.showToast(requireContext(), error);
            }
        });
    }

    private void observeUserProfileResult() {
        userProfileViewModel.getUserProfileResult().observe(getViewLifecycleOwner(), event -> {
            Result<UserProfileResponse> result = event.getContentIfNotHandled();

            if (result != null) {
                switch (result.getStatus()) {
                    case LOADING:
                        showLoading(true);
                        break;

                    case SUCCESS:
                        showLoading(false);
                        UserProfileResponse userProfile = result.getData();
                        if (userProfile != null) {
                            UiHelper.showToast(requireContext(), "Found user: " + userProfile.getDisplayName());
                            // TODO: Navigate to user profile screen or show user details
                        }
                        break;

                    case ERROR:
                        showLoading(false);
                        UiHelper.showToast(requireContext(), "Error: " );
                        break;
                }
            }
        });
    }

    private void observeRenderQr() {
        addFriendViewModel.getQrBitmap().observe(getViewLifecycleOwner(), bitmap -> {
            if (bitmap != null) {
                binding.imgQr.setImageBitmap(bitmap);
            }
        });
    }

    private void generateQr() {
        showLoading(true);
        
        addFriendViewModel.generateQrBitmap(authManager.getUserId(), 300);

        // Observe the QR bitmap from ViewModel
        addFriendViewModel.getQrBitmap().observe(getViewLifecycleOwner(), bitmap -> {
            if (bitmap != null) {
                binding.imgQr.setImageBitmap(bitmap);
                showLoading(false);
            }
        });
    }

    private void setupAnimations() {
        ChatAppAnimation.animateCardEntrance(binding.qrCodeCard);
    }

    private void setupFragmentResultListener() {
        getParentFragmentManager().setFragmentResultListener(
                "qr_key",
                getViewLifecycleOwner(),
                (requestKey, bundle) -> {
                    String qrData = bundle.getString("qr_result");
                    if (qrData != null) {
                        addFriendViewModel.handleQr(qrData);
                    }
                }
        );
    }

    private void setupClickListeners() {
        binding.btnBack.setOnClickListener(v -> NavHostFragment.findNavController(this).popBackStack());

        binding.qrCodeCard.setOnClickListener(v -> {
            ChatAppAnimation.animateCardClick(v);

            FragmentManager fm = getParentFragmentManager();

            // tránh mở nhiều dialog khi spam click
            if (fm.findFragmentByTag("qr_fullscreen") != null) {
                return;
            }

            FullscreenQRDialogFragment dialog =
                    FullscreenQRDialogFragment.newInstance(
                            authManager.getDisplayName(),
                            authManager.getUserId()
                    );

            dialog.show(fm, "qr_fullscreen");
        });

        binding.countryCodeLayout.setOnClickListener(v -> showCountryCodePicker());

        binding.btnSearchPhone.setOnClickListener(v -> handleSearchByPhoneNumber());

        binding.scanQROption.setOnClickListener(v -> {
            ChatAppAnimation.animateCardClick(v);
            NavHostFragment.findNavController(this)
                    .navigate(R.id.action_global_qrScanner);
        });

        binding.suggestedFriendsOption.setOnClickListener(v ->
            UiHelper.showToast(requireContext(),  "Xem ban be co the quen")
            // TODO: gợi ý bạn bè
        );

        binding.etPhoneNumber.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                String phone = s.toString().trim();

                if (phone.length() != 10) {
                    binding.cardUserResult.setVisibility(View.GONE);
                } else {
                    handleSearchByPhoneNumber();
                }
            }
        });

        binding.btnAddFriend.setOnClickListener(v -> handleAddFriend());
    }

    private void showCountryCodePicker() {
        String[] countryCodes = {"+84 (Vietnam)", "+1 (USA)", "+44 (UK)", "+81 (Japan)", "+82 (Korea)"};

        AlertDialog.Builder builder = new AlertDialog.Builder(
                requireContext(),
                R.style.DarkAlertDialog
        );

        builder.setTitle("Chọn mã quốc gia");
        builder.setItems(countryCodes, (dialog, which) -> {
            String selectedCode = countryCodes[which].split(" ")[0];
            binding.tvCountryCode.setText(selectedCode);
        });
        builder.show();
    }

    private void showLoading(boolean isLoading) {
        if (binding == null) return;

        if (isLoading) {
            binding.loadingOverlay.setVisibility(View.VISIBLE);
        } else {
            binding.loadingOverlay.setVisibility(View.GONE);
        }
    }

    private void showSearchResult(String avatarUrl, String name, String phoneNumber, String status) {
        binding.cardUserResult.setVisibility(View.VISIBLE);
        binding.tvUserNameResult.setText(name);
        binding.tvPhone.setText(phoneNumber);

        Glide.with(this)
                .load(avatarUrl)
                .placeholder(R.drawable.default_avatar)
                .error(R.drawable.default_avatar)
                .circleCrop()
                .into(binding.imgAvatar);

       setupButtonAddFriend(status);
    }

    @SuppressLint("SetTextI18n")
    private void setupButtonAddFriend(String status) {
        if(status.equals(FriendshipStatus.NONE.name())) {
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText("Kết bạn");
            binding.btnAddFriend.setEnabled(true);
        } else if(status.equals(FriendshipStatus.ACCEPTED.name())) {
            binding.btnAddFriend.setVisibility(View.GONE);
        } else if (status.equals(FriendshipStatus.PENDING.name())){
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText("Đã gửi");
            binding.btnAddFriend.setEnabled(false);
        } else if (status.equals(FriendshipStatus.INVITED.name())){
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText("Xác nhận");
            binding.btnAddFriend.setEnabled(true);
        }
    }

    private void hideSearchResult() {
        binding.cardUserResult.setVisibility(View.GONE);
    }

    private void handleSearchByPhoneNumber() {
        String phoneNumber = binding.etPhoneNumber.getText().toString().trim();
//        String countryCode = binding.tvCountryCode.getText().toString();
//        String fullNumber = countryCode + phoneNumber;
        // todo : chỉnh đúng số điện thoại cho từng quốc gia
        userProfileViewModel.searchUserProfileByPhoneNumber(phoneNumber);
    }

    private void handleGetUserProfile(String userId) {
        if (!isAdded()) return;

        userProfileViewModel.getUserProfile(userId);
    }

    private void handleSearchError(String errorCode) {
        if (UserProfileError.PHONE_NUMBER_EMPTY.name().equals(errorCode)) {
            binding.etPhoneNumber.setError("Vui lòng nhập số điện thoại");
            AuthAnimation.shake(requireContext(), binding.etPhoneNumber);
            UiHelper.showToast(requireContext(), "Vui lòng nhập số điện thoại");
            return;
        }

        if (UserProfileError.PHONE_NUMBER_INVALID.name().equals(errorCode)) {
            binding.etPhoneNumber.setError("Số điện thoại không hợp lệ");
            AuthAnimation.shake(requireContext(), binding.etPhoneNumber);
            UiHelper.showToast(requireContext(), "Số điện thoại không hợp lệ");
            return;
        }

        UiHelper.showToast(requireContext(), "Lỗi: " + errorCode);
    }

    private void handleAddFriend() {
        addFriendViewModel.sendFriendRequest(userId);
    }


}
