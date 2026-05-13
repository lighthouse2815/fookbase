package com.dangngulon.frontend.feature.zola.presentation.ui.fragments;

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

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.animation.AuthAnimation;
import com.dangngulon.frontend.core.common.ui.animation.ChatAppAnimation;
import com.dangngulon.frontend.core.common.ui.helpers.AvatarImageLoader;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.utils.enums.FriendshipStatus;
import com.dangngulon.frontend.core.utils.enums.ProfileType;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.databinding.FragmentAddFriendBinding;
import com.dangngulon.frontend.feature.zola.presentation.error.AddFriendErrorMapper;
import com.dangngulon.frontend.feature.zola.presentation.error.AddFriendProfileErrorMapper;
import com.dangngulon.frontend.feature.zola.presentation.model.AddFriendProfileUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.AddFriendSearchResultUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendshipUiModel;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.AddFriendViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class AddFriendFragment extends Fragment {

    private static final String QR_REQUEST_KEY = "qr_key";
    private static final String QR_RESULT_KEY = "qr_result";
    private static final String QR_FULLSCREEN_TAG = "qr_fullscreen";

    private FragmentAddFriendBinding binding;
    private AddFriendViewModel addFriendViewModel;

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
        hideSearchResult();
        generateQr();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        addFriendViewModel = new ViewModelProvider(this).get(AddFriendViewModel.class);
    }

    private void observeViewModel() {
        observeSearchByPhoneNumber();
        observeQrResult();
        observeUserProfileResult();
        observeRenderQr();
        observeAddFriendResult();
    }

    private void observeAddFriendResult() {
        addFriendViewModel.getSendFriendRequestResult().observe(getViewLifecycleOwner(), event -> {
            Result<FriendshipUiModel> result = event.getContentIfNotHandled();
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    binding.btnAddFriend.setText(R.string.add_friend_status_sent);
                    binding.btnAddFriend.setEnabled(false);
                    break;

                case ERROR:
                    showLoading(false);
                    handleAddFriendError(result.getMessage());
                    break;
            }
        });
    }

    private void observeSearchByPhoneNumber() {
        addFriendViewModel.getSearchProfileResult().observe(getViewLifecycleOwner(), event -> {
            Result<AddFriendSearchResultUiModel> result = event.getContentIfNotHandled();
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    AddFriendSearchResultUiModel userProfile = result.getData();
                    if (userProfile == null) {
                        hideSearchResult();
                        return;
                    }

                    showSearchResult(
                            userProfile.getAvatarUrl(),
                            userProfile.getDisplayName(),
                            userProfile.getPhoneNumber(),
                            userProfile.getFriendshipStatus()
                    );
                    userId = userProfile.getUserId();
                    break;

                case ERROR:
                    showLoading(false);
                    handleAddFriendError(result.getMessage());
                    hideSearchResult();
                    break;
            }
        });
    }

    private void observeQrResult() {
        addFriendViewModel.getUserIdEvent().observe(getViewLifecycleOwner(), event -> {
            String id = event.getContentIfNotHandled();
            if (id != null) {
                userId = id;
                handleGetUserProfile(id);
            }
        });

        addFriendViewModel.getErrorQrEvent().observe(getViewLifecycleOwner(), event -> {
            String error = event.getContentIfNotHandled();
            if (error != null) {
                showLoading(false);
                UiHelper.showToast(requireContext(), error);
            }
        });
    }

    private void observeUserProfileResult() {
        addFriendViewModel.getUserProfileResult().observe(getViewLifecycleOwner(), event -> {
            Result<AddFriendProfileUiModel> result = event.getContentIfNotHandled();
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    AddFriendProfileUiModel userProfile = result.getData();
                    if (userProfile != null) {
                        navigateToUserProfile(userProfile);
                    }
                    break;

                case ERROR:
                    showLoading(false);
                    handleAddFriendError(result.getMessage());
                    break;
            }
        });
    }

    private void observeRenderQr() {
        addFriendViewModel.getQrBitmap().observe(getViewLifecycleOwner(), bitmap -> {
            if (bitmap != null) {
                binding.imgQr.setImageBitmap(bitmap);
            }
            showLoading(false);
        });
    }

    private void generateQr() {
        showLoading(true);
        addFriendViewModel.generateMyQrBitmap(300);
    }

    private void setupAnimations() {
        ChatAppAnimation.animateCardEntrance(binding.qrCodeCard);
    }

    private void setupFragmentResultListener() {
        getParentFragmentManager().setFragmentResultListener(
                QR_REQUEST_KEY,
                getViewLifecycleOwner(),
                (requestKey, bundle) -> {
                    String qrData = bundle.getString(QR_RESULT_KEY);
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

            FragmentManager fragmentManager = getParentFragmentManager();
            if (fragmentManager.findFragmentByTag(QR_FULLSCREEN_TAG) != null) {
                return;
            }

            String currentUserId = addFriendViewModel.getCurrentUserId();
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                UiHelper.showToast(requireContext(), "Khong tim thay thong tin nguoi dung");
                return;
            }

            FullscreenQRDialogFragment dialog = FullscreenQRDialogFragment.newInstance(
                    addFriendViewModel.getCurrentDisplayName(),
                    currentUserId
            );
            dialog.show(fragmentManager, QR_FULLSCREEN_TAG);
        });

        binding.countryCodeLayout.setOnClickListener(v -> showCountryCodePicker());
        binding.btnSearchPhone.setOnClickListener(v -> handleSearchByPhoneNumber());

        binding.scanQROption.setOnClickListener(v -> {
            ChatAppAnimation.animateCardClick(v);
            NavHostFragment.findNavController(this).navigate(R.id.action_global_qrScanner);
        });

        binding.suggestedFriendsOption.setOnClickListener(v -> {
            ChatAppAnimation.animateCardClick(v);
            NavHostFragment.findNavController(this).navigate(R.id.action_global_friendRequests);
        });

        binding.etPhoneNumber.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                String phone = s.toString().trim();

                if (phone.length() != 10) {
                    hideSearchResult();
                    return;
                }

                handleSearchByPhoneNumber();
            }
        });

        binding.btnAddFriend.setOnClickListener(v -> handleAddFriend());
    }

    private void showCountryCodePicker() {
        String[] countryCodes = {
                "+84 (Vietnam)",
                "+1 (USA)",
                "+44 (UK)",
                "+81 (Japan)",
                "+82 (Korea)"
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext(), R.style.DarkAlertDialog);
        builder.setTitle(R.string.country_code_picker_title);
        builder.setItems(countryCodes, (dialog, which) -> {
            String selectedCode = countryCodes[which].split(" ")[0];
            binding.tvCountryCode.setText(selectedCode);
        });
        builder.show();
    }

    private void showLoading(boolean isLoading) {
        if (binding == null) {
            return;
        }

        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showSearchResult(String avatarUrl, String name, String phoneNumber, String status) {
        binding.cardUserResult.setVisibility(View.VISIBLE);
        binding.tvUserNameResult.setText(name);
        binding.tvPhone.setText(phoneNumber);

        AvatarImageLoader.load(binding.imgAvatar, avatarUrl);

        setupButtonAddFriend(status);
    }

    private void setupButtonAddFriend(String status) {
        if (FriendshipStatus.NONE.name().equals(status)) {
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText(R.string.add_friend_status_add_friend);
            binding.btnAddFriend.setEnabled(true);
            return;
        }

        if (FriendshipStatus.ACCEPTED.name().equals(status)) {
            binding.btnAddFriend.setVisibility(View.GONE);
            return;
        }

        if (FriendshipStatus.PENDING.name().equals(status)) {
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText(R.string.add_friend_status_sent);
            binding.btnAddFriend.setEnabled(false);
            return;
        }

        if (FriendshipStatus.INVITED.name().equals(status)) {
            binding.btnAddFriend.setVisibility(View.VISIBLE);
            binding.btnAddFriend.setText(R.string.add_friend_status_accept);
            binding.btnAddFriend.setEnabled(true);
            return;
        }

        binding.btnAddFriend.setVisibility(View.GONE);
    }

    private void hideSearchResult() {
        binding.cardUserResult.setVisibility(View.GONE);
    }

    private void handleSearchByPhoneNumber() {
        String phoneNumber = binding.etPhoneNumber.getText().toString().trim();
        addFriendViewModel.searchUserProfileByPhoneNumber(phoneNumber);
    }

    private void handleGetUserProfile(String profileUserId) {
        if (!isAdded()) {
            return;
        }

        addFriendViewModel.getUserProfile(profileUserId);
    }

    private void handleAddFriendError(String errorCode) {
        switch (AddFriendProfileErrorMapper.map(errorCode)) {
            case PHONE_NUMBER_EMPTY:
                binding.etPhoneNumber.setError(getString(R.string.add_friend_error_phone_required));
                AuthAnimation.shake(requireContext(), binding.etPhoneNumber);
                UiHelper.showToast(requireContext(), R.string.add_friend_error_phone_required);
                return;
            case PHONE_NUMBER_INVALID:
                binding.etPhoneNumber.setError(getString(R.string.add_friend_error_phone_invalid));
                AuthAnimation.shake(requireContext(), binding.etPhoneNumber);
                UiHelper.showToast(requireContext(), R.string.add_friend_error_phone_invalid);
                return;
            case UNKNOWN:
            default:
                break;
        }

        switch (AddFriendErrorMapper.map(errorCode)) {
            case USER_ID_EMPTY:
                UiHelper.showToast(requireContext(), R.string.add_friend_error_select_user);
                return;
            case UNKNOWN:
            default:
                UiHelper.showToast(
                        requireContext(),
                        getString(R.string.add_friend_error_with_code, String.valueOf(errorCode))
                );
        }
    }

    private void handleAddFriend() {
        addFriendViewModel.sendFriendRequest(userId);
    }

    private void navigateToUserProfile(AddFriendProfileUiModel userProfile) {
        Bundle args = new Bundle();
        args.putString("profileType", ProfileType.STRANGER.name());
        args.putString("userId", userProfile.getUserId());
        args.putString("userName", userProfile.getDisplayName());
        args.putString("nickname", "");

        NavHostFragment.findNavController(this)
                .navigate(R.id.action_global_userProfile, args);
    }
}
