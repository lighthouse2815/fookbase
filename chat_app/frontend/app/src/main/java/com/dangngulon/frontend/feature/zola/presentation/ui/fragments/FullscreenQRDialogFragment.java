package com.dangngulon.frontend.feature.zola.presentation.ui.fragments;

import android.app.Dialog;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.*;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.WindowCompat;
import androidx.fragment.app.DialogFragment;
import androidx.lifecycle.ViewModelProvider;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.DialogQrFullscreenBinding;
import com.dangngulon.frontend.databinding.DialogQrOptionsBinding;
import com.dangngulon.frontend.core.common.ui.animation.ChatAppAnimation;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.AddFriendViewModel;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.FullscreenQRViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class FullscreenQRDialogFragment extends DialogFragment {
    private static final String ARG_USERNAME = "username";
    private static final String ARG_USERID = "user_id";
    private String userName;
    private String userId;
    private DialogQrFullscreenBinding binding;
    private AddFriendViewModel addFriendViewModel;
    private FullscreenQRViewModel fullscreenQRViewModel;

    public static FullscreenQRDialogFragment newInstance(String userName, String userId) {
        FullscreenQRDialogFragment fragment = new FullscreenQRDialogFragment();
        Bundle args = new Bundle();
        args.putString(ARG_USERNAME, userName);
        args.putString(ARG_USERID, userId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setStyle(STYLE_NORMAL, android.R.style.Theme_Black_NoTitleBar_Fullscreen);

        if (getArguments() != null) {
            userName = getArguments().getString(ARG_USERNAME);
            userId = getArguments().getString(ARG_USERID);
        }
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        Dialog dialog = super.onCreateDialog(savedInstanceState);

        Window window = dialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
            window.setWindowAnimations(R.style.DialogSlideAnimation);
            WindowCompat.setDecorFitsSystemWindows(window, false);
        }

        return dialog;
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = DialogQrFullscreenBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        initViewModels();

        UiHelper.setupBottomNavigation(
                this,
                binding.rootLayout,
                R.color.background_dark
        );

        binding.tvUserNameLarge.setText(userName);

        generateQr();
        setupAnimations();
        initEvents();
        observeViewModel();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (binding != null) {
            binding = null;
        }
    }

    private void initViewModels() {
        fullscreenQRViewModel = new ViewModelProvider(this).get(FullscreenQRViewModel.class);
        addFriendViewModel = new ViewModelProvider(this).get(AddFriendViewModel.class);
    }

    private void initEvents(){
        View.OnClickListener dismissListener = v -> dismiss();
        binding.btnBackQR.setOnClickListener(dismissListener);
        binding.btnCloseQR.setOnClickListener(dismissListener);

        binding.btnShare.setOnClickListener(v ->{
            if (getContext() != null) {
                UiHelper.showToast(getContext(), "Chia se ma QR");
            }
        });

        binding.btnSave.setOnClickListener(v -> {
            ChatAppAnimation.animateButtonClick(v);
            Bitmap qrBitmap = addFriendViewModel.getQrBitmap().getValue();
            if (qrBitmap != null) {
                fullscreenQRViewModel.saveQr(qrBitmap);
            }
        });

        binding.btnOptions.setOnClickListener(v ->
                showDialogQROptions()
        );
    }

    private void setupAnimations(){
        ChatAppAnimation.animateCardEntrance(binding.qrCardContainer);
    }

    private void observeViewModel() {
        fullscreenQRViewModel.getSaveResult().observe(getViewLifecycleOwner(), event -> {
            Boolean success = event.getContentIfNotHandled();
            if (success == null) {
                return;
            }

            if (success) {
                UiHelper.showToast(requireContext(), "Da luu ma QR vao thu vien");
            } else {
                UiHelper.showToast(requireContext(), "Luu QR that bai");
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

    private void generateQr() {
        showLoading(true);

        addFriendViewModel.generateQrBitmap(userId, 600);

        addFriendViewModel.getQrBitmap().observe(getViewLifecycleOwner(), bitmap -> {
            if (binding == null) {
                return;
            }

            if (bitmap != null) {
                binding.ivQRCodeLarge.setImageBitmap(bitmap);
            }
            showLoading(false);
        });
    }

    private void showLoading(boolean isLoading) {
        if (binding == null) {
            return;
        }

        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showDialogQROptions() {
        Dialog dialog = new Dialog(requireContext(), R.style.BottomPopupDialog);

        DialogQrOptionsBinding dialogOptionBinding =
                DialogQrOptionsBinding.inflate(getLayoutInflater());

        dialog.setContentView(dialogOptionBinding.getRoot());

        Window window = dialog.getWindow();
        if (window != null) {
            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            window.setGravity(Gravity.BOTTOM);
            WindowCompat.setDecorFitsSystemWindows(window, false);
        }

        UiHelper.applySystemWindowInsets(dialog, R.id.rootLayout);

        dialog.show();
    }
}



