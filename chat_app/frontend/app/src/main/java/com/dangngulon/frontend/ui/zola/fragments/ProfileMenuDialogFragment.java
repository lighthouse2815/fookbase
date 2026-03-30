package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.DialogProfileMenuBinding;
import com.dangngulon.frontend.utils.enums.ProfileType;

public class ProfileMenuDialogFragment extends DialogFragment {
    private DialogProfileMenuBinding binding;
    private String profileType;
    private String userName;
    private ProfileMenuListener listener;

    public interface ProfileMenuListener {
        void onViewInfo();
        void onChangeNickname();
        void onBlockUser();
        void onUnfriend();
    }

    public static final String REQUEST_KEY = "profile_menu_request";
    public static final String ACTION_KEY = "action";
    public static final String ACTION_VIEW_INFO = "view_info";
    public static final String ACTION_CHANGE_NICKNAME = "change_nickname";
    public static final String ACTION_BLOCK_USER = "block_user";
    public static final String ACTION_UNFRIEND = "unfriend";

    public ProfileMenuDialogFragment() {
        // Required empty public constructor
    }

    public static ProfileMenuDialogFragment newInstance(String userName, String profileType) {
        ProfileMenuDialogFragment fragment = new ProfileMenuDialogFragment();
        Bundle args = new Bundle();
        args.putString("userName", userName);
        args.putString("profileType", profileType);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            userName = getArguments().getString("userName", "");
            profileType = getArguments().getString("profileType", ProfileType.STRANGER.name());
        }
        setStyle(STYLE_NORMAL, R.style.BottomSheetDialogTheme);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = DialogProfileMenuBinding.inflate(inflater, container, false);
        
        setupViews();
        setupListeners();
        
        return binding.getRoot();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void setupViews() {
        // Hide change nickname for own profile
        if (profileType.equals(ProfileType.MY.name())) {
            binding.menuChangeNickname.setVisibility(View.GONE);
            binding.menuBlock.setVisibility(View.GONE);
            binding.menuUnfriend.setVisibility(View.GONE);
        }
        
        // Show unfriend button only for friends
        if (profileType.equals(ProfileType.FRIEND.name())) {
            binding.menuUnfriend.setVisibility(View.VISIBLE);
        } else {
            binding.menuUnfriend.setVisibility(View.GONE);
        }
    }

    private void setupListeners() {
        // View Info
        binding.menuViewInfo.setOnClickListener(v -> {
            sendResult(ACTION_VIEW_INFO);
            dismiss();
        });

        // Change Nickname
        binding.menuChangeNickname.setOnClickListener(v -> {
            sendResult(ACTION_CHANGE_NICKNAME);
            dismiss();
        });

        // Block
        binding.menuBlock.setOnClickListener(v -> {
            sendResult(ACTION_BLOCK_USER);
            dismiss();
        });

        // Unfriend
        binding.menuUnfriend.setOnClickListener(v -> {
            sendResult(ACTION_UNFRIEND);
            dismiss();
        });
    }

    private void sendResult(String action) {
        Bundle result = new Bundle();
        result.putString(ACTION_KEY, action);
        getParentFragmentManager().setFragmentResult(REQUEST_KEY, result);
    }
}
