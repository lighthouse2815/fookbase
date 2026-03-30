package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AnimationUtils;
import android.view.animation.LayoutAnimationController;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentCreateGroupBinding;
import com.dangngulon.frontend.ui.zola.model.SelectableContactItem;
import com.dangngulon.frontend.ui.zola.adapters.SelectableContactAdapter;
import com.dangngulon.frontend.ui.zola.adapters.SelectedMemberAdapter;
import com.dangngulon.frontend.ui.common.animation.AuthAnimation;
import com.dangngulon.frontend.ui.common.animation.ChatAppAnimation;
import com.dangngulon.frontend.utils.data.AuthManager;
import com.dangngulon.frontend.utils.enums.ConversationType;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.zola.CreateGroupViewModel;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.tabs.TabLayout;

import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class CreateGroupFragment extends Fragment
    implements SelectableContactAdapter.OnContactSelectionListener,
    SelectedMemberAdapter.OnMemberRemoveListener

{
    private SelectableContactAdapter contactAdapter;
    private SelectedMemberAdapter selectedMemberAdapter;
    private FragmentCreateGroupBinding binding;
    private CreateGroupViewModel viewModel;
    @Inject
    AuthManager authManager;


    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentCreateGroupBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViewModel();
        setupAdapters();
        setupListeners();
        setupAnimations(view);
        observeViewModel();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        viewModel = new ViewModelProvider(this)
                .get(CreateGroupViewModel.class);
    }

    private void setupListeners() {
        binding.btnBack.setOnClickListener(v -> {
            NavHostFragment.findNavController(this).popBackStack();
        });

        binding.groupAvatarContainer.setOnClickListener(v -> showAvatarPickerDialog());

        binding.tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                viewModel.onTabChanged(tab.getPosition());
            }

            @Override public void onTabUnselected(TabLayout.Tab tab) {}
            @Override public void onTabReselected(TabLayout.Tab tab) {}
        });

        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                // No-op
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterContacts(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {
                // No-op
            }
        });

        binding.fabNext.setOnClickListener(v -> handleCreateGroup());
    }

    private void setupAdapters() {
        setupRecentUserChatAdapters();
        setupSelectedAdapters();
    }

    private void setupRecentUserChatAdapters() {
        contactAdapter = new SelectableContactAdapter(this);
        loadRecentUserChatItems();
        binding.rvContacts.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvContacts.setAdapter(contactAdapter);

        LayoutAnimationController controller =
                AnimationUtils.loadLayoutAnimation(
                        requireContext(),
                        R.anim.layout_animation_from_bottom
                );

        binding.rvContacts.setLayoutAnimation(controller);
        binding.rvContacts.scheduleLayoutAnimation();
    }

    private void setupSelectedAdapters(){
        selectedMemberAdapter = new SelectedMemberAdapter(this);
        binding.rvSelectedMembers.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        binding.rvSelectedMembers.setAdapter(selectedMemberAdapter);
    }

    private void observeViewModel() {
        observeContacts(viewModel.getselectableRecentUserChatItemResult());
        observeContacts(viewModel.getselectableContactItemResult());
        observeContacts(viewModel.getSearchResult());
    }

    private void observeContacts(LiveData<Result<List<SelectableContactItem>>> liveData){
        liveData.observe(getViewLifecycleOwner(), result -> {

            if (result == null) return;

            switch (result.getStatus()) {

                case LOADING:
                    if (contactAdapter.getItemCount() == 0) {
                        showLoading(true);
                    }
                    break;

                case SUCCESS:
                    showLoading(false);

                    List<SelectableContactItem> list = result.getData();

                    if (list == null || list.isEmpty()) {
                        showLoadingState();
                    } else {
                        hideLoadingState();
                        contactAdapter.submitList(list);
                    }
                    break;

                case ERROR:
                    showLoading(false);
                    Toast.makeText(requireContext(),
                            result.getMessage(),
                            Toast.LENGTH_SHORT).show();
                    break;
            }
        });
    }

    private void loadRecentUserChatItems() {
        viewModel.loadRecentUserChatItem();
    }

    private void filterContacts(String query) {
        viewModel.search(query);
    }

    private void showAvatarPickerDialog() {
        BottomSheetDialog dialog =
                new BottomSheetDialog(requireContext(), R.style.BottomSheetDialogTheme);

        dialog.setContentView(R.layout.dialog_avatar_picker);

        // Emoji mapping
        int[] emojiViews = {
                R.id.emoji1,
                R.id.emoji2,
                R.id.emoji3,
                R.id.emoji4,
                R.id.emoji5
        };

        int[] emojiDrawables = {
                R.drawable.emoji_calendar,
                R.drawable.emoji_megaphone,
                R.drawable.emoji_checklist,
                R.drawable.emoji_image,
                R.drawable.emoji_pencil
        };

        for (int i = 0; i < emojiViews.length; i++) {
            int drawable = emojiDrawables[i];

            View emojiView = dialog.findViewById(emojiViews[i]);
            if (emojiView != null) {
                emojiView.setOnClickListener(v -> {
                    selectEmojiAvatar(drawable);
                    dialog.dismiss();
                });
            }
        }

        View takePhoto = dialog.findViewById(R.id.optionTakePhoto);
        if (takePhoto != null) {
            takePhoto.setOnClickListener(v -> {
                Toast.makeText(requireContext(),
                        getString(R.string.take_photo),
                        Toast.LENGTH_SHORT).show();
                dialog.dismiss();
            });
        }

        View choosePhoto = dialog.findViewById(R.id.optionChoosePhoto);
        if (choosePhoto != null) {
            choosePhoto.setOnClickListener(v -> {
                Toast.makeText(requireContext(),
                        getString(R.string.choose_photo),
                        Toast.LENGTH_SHORT).show();
                dialog.dismiss();
            });
        }

        dialog.show();
    }

    private void selectEmojiAvatar(int drawableRes) {
        binding.ivCameraIcon.setVisibility(View.GONE);
        binding.ivGroupAvatar.setVisibility(View.VISIBLE);
        binding.ivGroupAvatar.setImageResource(drawableRes);
        
        ChatAppAnimation.scaleIn(binding.ivGroupAvatar);
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showLoadingState(){
        binding.emptyState.setVisibility(View.VISIBLE);
        binding.rvContacts.setVisibility(View.GONE);
    }

    private void hideLoadingState(){
        binding.emptyState.setVisibility(View.GONE);
        binding.rvContacts.setVisibility(View.VISIBLE);
    }

    private void setupAnimations(View view) {
        ChatAppAnimation.playEnterAnimations(view, requireContext());
    }

    private void handleCreateGroup() {
        String groupName = binding.etGroupName.getText().toString().trim();
        if (groupName.isEmpty()) {
            Toast.makeText(getContext(), "Vui long dat ten nhom", Toast.LENGTH_SHORT).show();
            binding.etGroupName.requestFocus();
            AuthAnimation.shake(requireContext(),binding.etGroupName);
            return;
        }

        if (selectedMemberAdapter.getMemberCount() < 2) {
            Toast.makeText(getContext(), "Chon it nhat 2 thanh vien", Toast.LENGTH_SHORT).show();
            return;
        }

        viewModel.createConversation(
            ConversationType.GROUP,
            groupName,
            authManager.getUserId(),
            selectedMemberAdapter.getCurrentList()
        );
    }

    @Override
    public void onContactSelected(SelectableContactItem contact, boolean isSelected) {
        updateSelectedCount();

        if (isSelected) {
            selectedMemberAdapter.addMember(contact);
        } else {
            selectedMemberAdapter.removeMember(contact);
        }

        updateSelectedMembersVisibility();
    }

    @Override
    public void onMemberRemoved(SelectableContactItem contact) {
        contactAdapter.removeSelection(contact.getUserId());
        selectedMemberAdapter.removeMember(contact);
        updateSelectedCount();
        updateSelectedMembersVisibility();
    }

    private void updateSelectedCount() {
        int count = contactAdapter.getSelectedCount();
        binding.tvSelectedCount.setText(
                getString(R.string.selected_count, count)
        );
    }

    private void updateSelectedMembersVisibility() {
        int count = selectedMemberAdapter.getMemberCount();
        if (count > 0) {
            if (binding.selectedMembersLayout.getVisibility() != View.VISIBLE) {
                binding.selectedMembersLayout.setVisibility(View.VISIBLE);
                ChatAppAnimation.playSelectedMembersShow(binding.selectedMembersLayout,requireContext());
            }
        } else {
            if (binding.selectedMembersLayout.getVisibility() == View.VISIBLE) {
                ChatAppAnimation.hideWithSlideDown(
                        binding.selectedMembersLayout,
                        requireContext()
                );
            }
        }
    }


}
