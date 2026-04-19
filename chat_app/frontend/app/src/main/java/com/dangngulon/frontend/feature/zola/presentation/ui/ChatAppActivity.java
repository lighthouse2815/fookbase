package com.dangngulon.frontend.feature.zola.presentation.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.navigation.ui.NavigationUI;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.animation.ChatAppAnimation;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.utils.enums.ProfileType;
import com.dangngulon.frontend.databinding.ActivityChatAppBinding;
import com.dangngulon.frontend.databinding.DialogAddMenuBinding;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.ChatAppViewModel;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.tabs.TabLayout;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ChatAppActivity extends AppCompatActivity {

    private static final long ANIMATION_DURATION = 200L;

    private static final int TAB_MODE_NONE = 0;
    private static final int TAB_MODE_MESSAGES = 1;
    private static final int TAB_MODE_CONTACTS = 2;

    private static final String MESSAGES_TAB_1 = "Uu tien";
    private static final String MESSAGES_TAB_2 = "Khac";
    private static final String CONTACTS_TAB_1 = "Ban be";
    private static final String CONTACTS_TAB_2 = "Loi moi";

    private ActivityChatAppBinding binding;
    private NavController navController;
    private ChatAppViewModel chatAppViewModel;

    private int currentTabMode = TAB_MODE_NONE;
    private boolean suppressTopTabCallback = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        binding = ActivityChatAppBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        chatAppViewModel = new ViewModelProvider(this).get(ChatAppViewModel.class);

        setupNavigation();
        setupBottomNavigation();
        setupTopTabEvents();
        setupNavigationListener();
        initEvents();

        UiHelper.setupBottomNavigation(this, R.id.bottomNavigation, R.color.ZALO_background_surface);
        UiHelper.hideActionBar(this);
    }

    @Override
    protected void onStart() {
        super.onStart();
        chatAppViewModel.connectSocket();
    }

    @Override
    protected void onStop() {
        chatAppViewModel.disconnectSocket();
        super.onStop();
    }

    private void setupNavigation() {
        NavHostFragment navHostFragment = (NavHostFragment) getSupportFragmentManager()
                .findFragmentById(R.id.nav_host);

        if (navHostFragment != null) {
            navController = navHostFragment.getNavController();
        }
    }

    private void setupBottomNavigation() {
        if (navController != null) {
            NavigationUI.setupWithNavController(binding.bottomNavigation, navController);
        }
    }

    private void setupTopTabEvents() {
        binding.tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                if (suppressTopTabCallback || navController == null) {
                    return;
                }

                if (currentTabMode != TAB_MODE_CONTACTS) {
                    return;
                }

                int currentDestinationId = getCurrentDestinationId();
                int tabPosition = tab.getPosition();

                if (tabPosition == 1 && currentDestinationId == R.id.nav_contacts) {
                    navController.navigate(R.id.action_global_friendRequests);
                } else if (tabPosition == 0 && currentDestinationId == R.id.friendRequestsFragment) {
                    navController.popBackStack();
                }
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
            }
        });
    }

    private void setupNavigationListener() {
        if (navController != null) {
            navController.addOnDestinationChangedListener((controller, destination, arguments) -> {
                int destId = destination.getId();

                if (destId == R.id.nav_messages) {
                    currentTabMode = TAB_MODE_MESSAGES;
                    showHeaderAndTabLayout(MESSAGES_TAB_1, MESSAGES_TAB_2);
                    selectTopTabSilently(0);
                } else if (destId == R.id.nav_contacts) {
                    currentTabMode = TAB_MODE_CONTACTS;
                    showHeaderAndTabLayout(CONTACTS_TAB_1, CONTACTS_TAB_2);
                    selectTopTabSilently(0);
                } else if (destId == R.id.nav_groups || destId == R.id.nav_profile) {
                    currentTabMode = TAB_MODE_NONE;
                    showHeaderHideTabLayout();
                } else if (destId == R.id.userProfileFragment
                        || destId == R.id.createGroupFragment
                        || destId == R.id.addFriendFragment
                        || destId == R.id.friendRequestsFragment) {
                    currentTabMode = TAB_MODE_NONE;
                    hideHeaderAndBottomNav();
                }
            });
        }
    }

    private int getCurrentDestinationId() {
        if (navController == null || navController.getCurrentDestination() == null) {
            return -1;
        }
        return navController.getCurrentDestination().getId();
    }

    private void selectTopTabSilently(int position) {
        TabLayout.Tab tab = binding.tabLayout.getTabAt(position);
        if (tab == null) {
            return;
        }

        suppressTopTabCallback = true;
        tab.select();
        suppressTopTabCallback = false;
    }

    private void initEvents() {
        binding.btnAdd.setOnClickListener(v -> showAddMenu());

        binding.searchEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                Toast.makeText(this, "Tim kiem", Toast.LENGTH_SHORT).show();
            }
        });

        binding.btnQR.setOnClickListener(v -> {
            if (navController != null) {
                navController.navigate(R.id.action_global_qrScanner);
            }
        });
    }

    private void showAddMenu() {
        DialogAddMenuBinding dialogBinding = DialogAddMenuBinding.inflate(LayoutInflater.from(this));

        BottomSheetDialog dialog = new BottomSheetDialog(this);
        dialog.setContentView(dialogBinding.getRoot());

        dialogBinding.addFriendOption.setOnClickListener(v -> {
            dialog.dismiss();
            if (navController != null) {
                navController.navigate(R.id.action_global_addFriend);
            }
        });

        dialogBinding.createGroupOption.setOnClickListener(v -> {
            dialog.dismiss();
            if (navController != null) {
                navController.navigate(R.id.action_global_createGroup);
            }
        });

        dialog.show();
    }

    private void showHeaderAndTabLayout(String firstTabText, String secondTabText) {
        binding.headerLayout.setVisibility(View.VISIBLE);
        binding.bottomNavigation.setVisibility(View.VISIBLE);
        ChatAppAnimation.showTabLayoutWithFadeIn(binding.tabLayout, ANIMATION_DURATION);

        TabLayout.Tab firstTab = binding.tabLayout.getTabAt(0);
        TabLayout.Tab secondTab = binding.tabLayout.getTabAt(1);

        if (firstTab != null) {
            firstTab.setText(firstTabText);
        }
        if (secondTab != null) {
            secondTab.setText(secondTabText);
        }
    }

    private void showHeaderHideTabLayout() {
        binding.headerLayout.setVisibility(View.VISIBLE);
        binding.bottomNavigation.setVisibility(View.VISIBLE);
        ChatAppAnimation.hideTabLayoutWithFadeOut(binding.tabLayout, ANIMATION_DURATION);
    }

    private void hideHeaderAndBottomNav() {
        ChatAppAnimation.hideHeaderAndBottomNavWithAnimation(
                this,
                binding.headerLayout,
                binding.bottomNavigation,
                binding.tabLayout,
                ANIMATION_DURATION
        );
    }

    public void openUserProfile(ProfileType profileType, String userId, String userName, String nickname) {
        Bundle args = new Bundle();
        args.putString("profileType", profileType.name());
        args.putString("userId", userId);
        args.putString("userName", userName);
        args.putString("nickname", nickname);

        if (navController != null) {
            navController.navigate(R.id.action_global_userProfile, args);
        }
    }
}
