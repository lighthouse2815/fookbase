package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentChatDetailBinding;
import com.dangngulon.frontend.model.zola.response.MessageCursorPageResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.ui.zola.adapters.MessageAdapter;
import com.dangngulon.frontend.utils.data.AuthManager;
import com.dangngulon.frontend.viewmodel.zola.ChatDetailViewModel;
import com.google.android.material.snackbar.BaseTransientBottomBar;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.inject.Inject;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ChatDetailFragment extends Fragment {
    private static final String ARG_AVATAR_URL = "avatarUrl";
    private static final String ARG_NICKNAME = "nickname";
    private static final String ARG_CONVERSATION_ID = "conversationId";

    private FragmentChatDetailBinding binding;
    private ChatDetailViewModel viewModel;
    private MessageAdapter messageAdapter;

    @Inject
    AuthManager authManager;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentChatDetailBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViewModel();
        readArguments();
        setupRecyclerView();
        setupEvents();
        setupInputHandling();
        observeViewModel();
        requestMessages();

        viewModel.subscribeMessages(authManager.getUserId());
    }

    @Override
    public void onDestroyView() {
        binding.edtMessage.removeTextChangedListener(messageInputWatcher);
        binding.rvMessages.setAdapter(null);
        binding = null;
        super.onDestroyView();
    }

    private void initViewModel() {
        viewModel = new ViewModelProvider(this).get(ChatDetailViewModel.class);
    }

    private void readArguments() {
        Bundle args = getArguments();
        if (args == null) return;

        // 1. ConversationId → ViewModel
        String conversationId = args.getString(ARG_CONVERSATION_ID);
        viewModel.setConversationId(conversationId);

        // 2. Username (fallback)
        String username = args.getString(ARG_NICKNAME, "Unknown");
        binding.txtUsername.setText(username);

        // 3. Avatar
        String avatarUrl = args.getString(ARG_AVATAR_URL);
        loadAvatar(avatarUrl);
    }

    private void loadAvatar(String avatarUrl) {
        ImageView imgAvatar = binding.imgAvatar;

        if (TextUtils.isEmpty(avatarUrl)) {
            imgAvatar.setImageResource(R.drawable.default_avatar);
            return;
        }

        Glide.with(imgAvatar.getContext())
                .load(avatarUrl)
                .placeholder(R.drawable.default_avatar)
                .error(R.drawable.default_avatar)
                .into(imgAvatar);
    }

    private void setupRecyclerView() {
        if (messageAdapter == null) {
            messageAdapter = new MessageAdapter();
        }

        messageAdapter.setCurrentUserId(authManager.getUserId());

        LinearLayoutManager layoutManager = new LinearLayoutManager(requireContext());
        layoutManager.setStackFromEnd(true);

        binding.rvMessages.setLayoutManager(layoutManager);
        binding.rvMessages.setAdapter(messageAdapter);
    }

    private void setupEvents() {
        // Back navigation
        binding.btnBack.setOnClickListener(v -> navigateBack());

        requireActivity().getOnBackPressedDispatcher().addCallback(
                getViewLifecycleOwner(),
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        navigateBack();
                    }
                }
        );

        // Message input handling
        binding.edtMessage.addTextChangedListener(messageInputWatcher);
        updateActionButtonState(binding.edtMessage.getText());

        // Send button click
        binding.btnMic.setOnClickListener(v -> sendMessageIfPossible());

        // Editor action (Enter key)
        binding.edtMessage.setOnEditorActionListener(this::onEditorAction);
    }

    private final TextWatcher messageInputWatcher = new TextWatcher() {
        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            // no-op
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            // no-op
        }

        @Override
        public void afterTextChanged(Editable s) {
            updateActionButtonState(s);
        }
    };

    private void setupInputHandling() {
        // Input handling is now managed in setupEvents()
    }

    private boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
        if (actionId == EditorInfo.IME_ACTION_SEND) {
            sendMessageIfPossible();
            return true;
        }
        return false;
    }

    private void observeViewModel() {
        observeGetMessages();
        observeSendMessage();
        observeLoadMoreMessages();
    }

    private void observeGetMessages() {
        viewModel.getGetMessagesResult().observe(getViewLifecycleOwner(), result -> {
            if (result == null) return;

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    MessageCursorPageResponse data = result.getData();
                    if (data != null) {
                        List<MessageResponse> messages = new ArrayList<>(data.getMessages());
                        Collections.reverse(messages);
                        messageAdapter.submitMessages(messages);
                        viewModel.setCurrentMessages(data);
                        scrollToBottom();
                    }
                    break;

                case ERROR:
                    showLoading(false);
                    UiHelper.showToast(requireContext(), result.getMessage());
                    showError(result.getMessage());
                    break;
            }
        });
    }

//    private void observeSendMessage() {
//        viewModel.getSendMessageResult().observe(getViewLifecycleOwner(), result -> {
//            if (result == null) return;
//
//            switch (result.getStatus()) {
//                case LOADING:
//                    setSendingEnabled(false);
//                    break;
//
//                case SUCCESS:
//                    setSendingEnabled(true);
//                    break;
//
//                case ERROR:
//                    setSendingEnabled(true);
//                    showError(result.getMessage());
//                    break;
//            }
//        });
//    }

    private void observeSendMessage(){
        viewModel.messages.observe(getViewLifecycleOwner(), message -> {
            messageAdapter.add(message);
        });
    }

    private void observeLoadMoreMessages() {
        viewModel.getLoadMoreMessagesResult().observe(getViewLifecycleOwner(), result -> {
            if (result == null) return;

            switch (result.getStatus()) {
                case LOADING:
                    //  todo Show loading indicator for load more (could be a subtle indicator)
                    break;

                case SUCCESS:
                    MessageCursorPageResponse data = result.getData();
                    if (data != null && data.getMessages() != null) {

                        // 🔥 1. Copy + reverse newMessages
                        List<MessageResponse> newMessages = new ArrayList<>(data.getMessages());
                        Collections.reverse(newMessages);

                        // 🔥 2. Lấy current list (ListAdapter trả immutable list → vẫn dùng được)
                        List<MessageResponse> currentMessages = messageAdapter.getCurrentList();

                        // 🔥 3. Gộp lại
                        List<MessageResponse> allMessages = new ArrayList<>();
                        allMessages.addAll(newMessages);      // tin cũ (load thêm)
                        allMessages.addAll(currentMessages);  // tin hiện tại

                        // 🔥 4. Submit (phải là list mới)
                        messageAdapter.submitMessages(allMessages);

                        viewModel.setCurrentMessages(data);

                        // chi bi ti như lồn
                    }
                    break;

                case ERROR:
                    showError(result.getMessage());
                    break;
            }
        });
    }

    private void requestMessages() {
        viewModel.loadInitialMessages();
    }

    private void sendMessageIfPossible() {
        String text = getInputText();
        if (TextUtils.isEmpty(text)) {
            return;
        }

        viewModel.sendMessageRealTime(text);
        binding.edtMessage.setText("");
    }

    private String getInputText() {
        CharSequence text = binding.edtMessage.getText();
        return text == null ? "" : text.toString().trim();
    }

    private void updateActionButtonState(CharSequence input) {
        boolean hasText = input != null && !input.toString().trim().isEmpty();
        binding.btnMic.setImageResource(hasText ? R.drawable.ic_send : R.drawable.ic_mic_dark);
        binding.btnMic.setBackgroundResource(hasText ? R.drawable.ripple_circle : R.drawable.bg_chat_mic_button);
    }

    private void setSendingEnabled(boolean enabled) {
        binding.btnMic.setEnabled(enabled);
        binding.edtMessage.setEnabled(enabled);
    }

    private void scrollToBottom() {
        int count = messageAdapter.getItemCount();
        if (count > 0) {
            binding.rvMessages.scrollToPosition(count - 1);
        }
    }

    private void navigateBack() {
        NavController navController = NavHostFragment.findNavController(this);
        if (!navController.navigateUp()) {
            navController.popBackStack();
        }
    }

    private void showError(String message) {
        String errorMessage = TextUtils.isEmpty(message) ? "Something went wrong." : message;
        Snackbar.make(binding.getRoot(), errorMessage, BaseTransientBottomBar.LENGTH_SHORT).show();
    }

    private void showLoading(boolean show) {
        if (show) {
            binding.loadingOverlay.setVisibility(View.VISIBLE);
        } else {
            binding.loadingOverlay.setVisibility(View.GONE);
        }
    }


}
