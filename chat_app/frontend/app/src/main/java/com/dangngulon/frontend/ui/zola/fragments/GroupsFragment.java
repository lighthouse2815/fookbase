package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentGroupsBinding;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.ui.zola.adapters.ConversationAdapter;
import com.dangngulon.frontend.viewmodel.zola.GroupsViewModel;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class GroupsFragment extends Fragment {

    private GroupsViewModel groupsViewModel;
    private ConversationAdapter adapter;
    private FragmentGroupsBinding binding;


    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentGroupsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        setupRecyclerView();
        setupClickListeners();
        observeViewModel();
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initViewModel();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadGroups();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel(){
        groupsViewModel = new ViewModelProvider(this)
                .get(GroupsViewModel.class);
    }

    private void setupRecyclerView() {
        adapter = new ConversationAdapter();
        binding.groupsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.groupsRecyclerView.setAdapter(adapter);

        adapter.setOnConversationClickListener(new ConversationAdapter.OnConversationClickListener() {
            @Override
            public void onConversationClick(ConversationResponse conversation) {
                navigateToChatScreen(conversation);
            }

            @Override
            public void onConversationLongClick(ConversationResponse conversation) {
                // todo
            }
        });
    }

    private void setupClickListeners() {
        NavController navController = NavHostFragment.findNavController(this);

        binding.createGroupAction.setOnClickListener(v -> navController.navigate(
                R.id.action_global_createGroup
        ));
    }

    private void navigateToChatScreen(ConversationResponse conversation) {
        NavController navController = NavHostFragment.findNavController(this);

        Bundle args = new Bundle();
        args.putString("nickname", conversation.getName());
        args.putString("avatarUrl", conversation.getAvatarUrl());
        args.putString("conversationId", conversation.getConversationId());

        navController.navigate(
            R.id.action_global_chatDetailFragment,
            args
        );
    }

    private void observeViewModel(){
        groupsViewModel.getGroupsListResult()
                .observe(getViewLifecycleOwner(), result -> {
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            if (adapter.getItemCount() == 0) {
                                showLoading(true);
                            }
                            break;

                        case SUCCESS:
                            showLoading(false);
                            List<ConversationResponse> list = result.getData();

                            if (list == null || list.isEmpty()) {
                                binding.emptyState.setVisibility(View.VISIBLE);
                                binding.groupsRecyclerView.setVisibility(View.GONE);
                            } else {
                                binding.emptyState.setVisibility(View.GONE);
                                binding.groupsRecyclerView.setVisibility(View.VISIBLE);
                                adapter.submitConversations(list);
                            }
                            break;

                        case ERROR:
                            showLoading(false);
                            UiHelper.showToast(requireContext(), "lay groups that bai");
                            break;
                    }
                });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void loadGroups() {
        if (groupsViewModel.getGroupsListResult().getValue() == null) {
            groupsViewModel.getAllGroups();
        }
    }
}
