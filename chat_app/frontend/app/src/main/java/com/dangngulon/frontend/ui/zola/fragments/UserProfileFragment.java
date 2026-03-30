package com.dangngulon.frontend.ui.zola.fragments;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentUserProfileBinding;
import com.dangngulon.frontend.utils.enums.ProfileType;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class UserProfileFragment extends Fragment {
    private String profileType;
    private String userId;
    private String userName;
    private String nickname;
    private FragmentUserProfileBinding binding;


    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            profileType = getArguments().getString("profileType", ProfileType.STRANGER.name());
            userId = getArguments().getString("userId", "");
            userName = getArguments().getString("userName", "User");
            nickname = getArguments().getString("nickname", "");
        }
        
        // Setup FragmentResult listeners
        setupFragmentResultListeners();
    }

    @SuppressLint("SetTextI18n")
    private void setupFragmentResultListeners() {
        // Change Nickname Dialog Result
        getChildFragmentManager().setFragmentResultListener(
            ChangeNicknameDialogFragment.REQUEST_KEY,
            this,
            (requestKey, result) -> {
                String newNickname = result.getString(ChangeNicknameDialogFragment.RESULT_KEY);
                if (newNickname != null) {
                    nickname = newNickname;
                    binding.tvNickname.setText("( " + nickname + " )");
                    binding.tvNickname.setVisibility(View.VISIBLE);
                }
            });

        // Profile Menu Dialog Result
        getChildFragmentManager().setFragmentResultListener(
            ProfileMenuDialogFragment.REQUEST_KEY,
            this,
            (requestKey, result) -> {
                String action = result.getString(ProfileMenuDialogFragment.ACTION_KEY);
                if (action != null) {
                    handleProfileMenuAction(action);
                }
            });
    }

    private void handleProfileMenuAction(String action) {
        switch (action) {
            case ProfileMenuDialogFragment.ACTION_VIEW_INFO:
                Toast.makeText(getContext(), "View info", Toast.LENGTH_SHORT).show();
                break;
            case ProfileMenuDialogFragment.ACTION_CHANGE_NICKNAME:
                showChangeNicknameDialog();
                break;
            case ProfileMenuDialogFragment.ACTION_BLOCK_USER:
                showBlockConfirmDialog();
                break;
            case ProfileMenuDialogFragment.ACTION_UNFRIEND:
                showUnfriendConfirmDialog();
                break;

            default:
                break;
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentUserProfileBinding.inflate(inflater, container, false);
        
        initViews();
        setupListeners();
        updateUIForProfileType();
        animateViews();
        
        return binding.getRoot();
    }


    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    @SuppressLint("SetTextI18n")
    private void initViews() {
        // Set user name
        binding.tvUserName.setText(userName);
        
        // Set nickname if exists
        if (nickname != null && !nickname.isEmpty()) {
            binding.tvNickname.setText("( " + nickname + " )");
            binding.tvNickname.setVisibility(View.VISIBLE);
        }
    }

    private void setupListeners() {
        binding.btnBack.setOnClickListener(v -> {
           // todo
        });

        binding.btnMore.setOnClickListener(v -> showProfileMenu());

        binding.btnCall.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Calling " + userName + "...", Toast.LENGTH_SHORT).show();
            // todo
        });

        binding.btnAddFriendHeader.setOnClickListener(v -> sendFriendRequest());

        binding.btnMessage.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Opening chat with " + userName, Toast.LENGTH_SHORT).show();
            // todo
        });

        binding.btnAddFriend.setOnClickListener(v -> sendFriendRequest());

        binding.fabMessage.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Opening chat with " + userName, Toast.LENGTH_SHORT).show();
            // todo
        });

        binding.btnEditProfile.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Edit profile", Toast.LENGTH_SHORT).show();
            // todo
        });

        binding.btnChangeAvatar.setOnClickListener(v -> {
            Toast.makeText(getContext(), "Change avatar", Toast.LENGTH_SHORT).show();
            // todo
        });

        binding.btnEditName.setOnClickListener(v -> {
            if (profileType.equals(ProfileType.MY.name())) {
                Toast.makeText(getContext(), "Edit name", Toast.LENGTH_SHORT).show();
                // todo
            } else {
                showChangeNicknameDialog();
            }
        });
    }

    private void updateUIForProfileType() {
        switch (profileType) {
            case "MY":
                setupOwnProfile();
                break;
            case "FRIEND":
                setupFriendProfile();
                break;
            case "STRANGER":
                setupStrangerProfile();
                break;

            default:
                break;
        }
    }

    private void setupOwnProfile() {
        // Show own profile elements
        binding.btnChangeAvatar.setVisibility(View.VISIBLE);
        binding.btnEditProfile.setVisibility(View.VISIBLE);
        
        // Hide other profile elements
        binding.btnCall.setVisibility(View.GONE);
        binding.btnAddFriendHeader.setVisibility(View.GONE);
        binding.actionButtonsContainer.setVisibility(View.GONE);
        binding.fabMessage.setVisibility(View.GONE);
        binding.tvNickname.setVisibility(View.GONE);
        
        // Update bio text for own profile
        binding.tvBio.setText(R.string.update_your_status);
    }

    private void setupFriendProfile() {
        // Show friend profile elements
        binding.btnCall.setVisibility(View.VISIBLE);
        binding.fabMessage.setVisibility(View.VISIBLE);
        
        // Show nickname if exists
        if (nickname != null && !nickname.isEmpty()) {
            binding.tvNickname.setVisibility(View.VISIBLE);
        }
        
        // Hide other elements
        binding.btnAddFriendHeader.setVisibility(View.GONE);
        binding.actionButtonsContainer.setVisibility(View.GONE);
        binding.btnEditProfile.setVisibility(View.GONE);
        binding.btnChangeAvatar.setVisibility(View.GONE);
        
        // Update bio text
        String bioText = getString(R.string.no_activity_message, userName);
        binding.tvBio.setText(bioText);
    }

    private void setupStrangerProfile() {
        // Show stranger profile elements
        binding.btnCall.setVisibility(View.VISIBLE);
        binding.actionButtonsContainer.setVisibility(View.VISIBLE);
        binding.btnMessage.setVisibility(View.VISIBLE);
        binding.btnAddFriend.setVisibility(View.VISIBLE);
        
        // Optionally show add friend in header
        // binding.btnAddFriendHeader.setVisibility(View.VISIBLE);
        
        // Hide other elements
        binding.fabMessage.setVisibility(View.GONE);
        binding.btnEditProfile.setVisibility(View.GONE);
        binding.btnChangeAvatar.setVisibility(View.GONE);
        binding.tvNickname.setVisibility(View.GONE);
        
        // Show super badge for demo
        binding.superBadge.setVisibility(View.VISIBLE);
        
        // Update bio text
        binding.tvBio.setText("");
    }

    private void showProfileMenu() {
        ProfileMenuDialogFragment dialog = ProfileMenuDialogFragment.newInstance(userName, profileType);
        dialog.show(getChildFragmentManager(), "ProfileMenuDialog");
    }

    private void showChangeNicknameDialog() {
        ChangeNicknameDialogFragment dialog = ChangeNicknameDialogFragment.newInstance(userName, nickname);
        dialog.show(getChildFragmentManager(), "ChangeNicknameDialog");
    }


    private void showBlockConfirmDialog() {
        new AlertDialog.Builder(requireContext(), R.style.DarkAlertDialog)
            .setTitle("Block " + userName + "?")
            .setMessage("They won't be able to send you messages or see your profile.")
            .setPositiveButton("Block", (dialog, which) -> {
                Toast.makeText(getContext(), userName + " has been blocked", Toast.LENGTH_SHORT).show();
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void showUnfriendConfirmDialog() {
        new AlertDialog.Builder(requireContext(), R.style.DarkAlertDialog)
            .setTitle("Unfriend " + userName + "?")
            .setMessage("You will no longer be friends with this person.")
            .setPositiveButton("Unfriend", (dialog, which) -> {
                // Change profile type to stranger
                profileType = ProfileType.STRANGER.name();
                updateUIForProfileType();
                Toast.makeText(getContext(), "Unfriended " + userName, Toast.LENGTH_SHORT).show();
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void sendFriendRequest() {
        // Animate button
        Animation scaleAnim = AnimationUtils.loadAnimation(getContext(), R.anim.scale_up);
        binding.btnAddFriend.startAnimation(scaleAnim);
        
        Toast.makeText(getContext(), "Friend request sent to " + userName, Toast.LENGTH_SHORT).show();
        
        // Change button state
        binding.btnAddFriend.setVisibility(View.GONE);
        binding.btnAddFriendHeader.setVisibility(View.GONE);
    }

    private void animateViews() {
        // Animate avatar
        Animation scaleIn = AnimationUtils.loadAnimation(getContext(), R.anim.scale_up);
        binding.imgAvatar.startAnimation(scaleIn);

        // Animate name
        Animation fadeIn = AnimationUtils.loadAnimation(getContext(), R.anim.fade_in);
        fadeIn.setStartOffset(200);
        binding.tvUserName.startAnimation(fadeIn);

        // Animate action buttons
        if (binding.actionButtonsContainer.getVisibility() == View.VISIBLE) {
            Animation slideUp = AnimationUtils.loadAnimation(getContext(), R.anim.slide_up);
            slideUp.setStartOffset(300);
            binding.actionButtonsContainer.startAnimation(slideUp);
        }

        // Animate FAB
        if (binding.fabMessage.getVisibility() == View.VISIBLE) {
            Animation slideUp = AnimationUtils.loadAnimation(getContext(), R.anim.slide_up);
            slideUp.setStartOffset(400);
            binding.fabMessage.startAnimation(slideUp);
        }
    }

    // Public method to set profile type
    public void setProfileType(String type) {
        this.profileType = type;
        if (isAdded()) {
            updateUIForProfileType();
        }
    }

}
