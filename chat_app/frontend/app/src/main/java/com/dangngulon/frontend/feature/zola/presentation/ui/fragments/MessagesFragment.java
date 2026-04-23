package com.dangngulon.frontend.feature.zola.presentation.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentMessagesBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;
import com.dangngulon.frontend.feature.zola.presentation.ui.adapters.ConversationAdapter;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.MessagesViewModel;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class MessagesFragment extends Fragment {
    private MessagesViewModel messagesViewModel;
    private ConversationAdapter adapter;
    private FragmentMessagesBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentMessagesBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViewModel();
        setupRecyclerView();
        observeViewModel();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadConversations();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        messagesViewModel = new ViewModelProvider(this).get(MessagesViewModel.class);
    }

    private void setupRecyclerView() {
        adapter = new ConversationAdapter();
        adapter.setCurrentUserId(messagesViewModel.getCurrentUserId());
        binding.conversationsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.conversationsRecyclerView.setAdapter(adapter);

        adapter.setOnConversationClickListener(new ConversationAdapter.OnConversationClickListener() {
            @Override
            public void onConversationClick(ConversationUiModel conversation) {
                navigateToChatScreen(conversation);
            }

            @Override
            public void onConversationLongClick(ConversationUiModel conversation) {
                Toast.makeText(getContext(), "Tuy chon: " + conversation.getName(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void navigateToChatScreen(ConversationUiModel conversation) {
        NavController navController = NavHostFragment.findNavController(this);

        Bundle args = new Bundle();
        args.putString("nickname", conversation.getName());
        args.putString("avatarUrl", conversation.getAvatarUrl());
        args.putString("conversationId", conversation.getConversationId());

        navController.navigate(R.id.action_messagesFragment_to_chatDetailFragment, args);
    }

    private void observeViewModel() {
        messagesViewModel.getConversationListResult().observe(getViewLifecycleOwner(), result -> {
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    if (adapter.getItemCount() == 0) {
                        showLoading(true);
                    }
                    break;

                case SUCCESS:
                    showLoading(false);
                    List<ConversationUiModel> list = result.getData();

                    if (list == null || list.isEmpty()) {
                        showEmptyState();
                    } else {
                        hideEmptyState();
                        adapter.submitConversations(list);
                    }
                    break;

                case ERROR:
                    showLoading(false);
                    Toast.makeText(getContext(), "Lay conversation that bai", Toast.LENGTH_SHORT).show();
                    break;
            }
        });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showEmptyState() {
        binding.emptyState.setVisibility(View.VISIBLE);
        binding.conversationsRecyclerView.setVisibility(View.GONE);
    }

    private void hideEmptyState() {
        binding.emptyState.setVisibility(View.GONE);
        binding.conversationsRecyclerView.setVisibility(View.VISIBLE);
    }

    private void loadConversations() {
        messagesViewModel.getAllConversations();
    }
}
