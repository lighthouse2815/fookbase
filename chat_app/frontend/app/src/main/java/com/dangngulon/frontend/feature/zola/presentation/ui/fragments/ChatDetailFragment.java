package com.dangngulon.frontend.feature.zola.presentation.ui.fragments;

import android.Manifest;
import android.app.Dialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Environment;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.PagerSnapHelper;
import androidx.recyclerview.widget.RecyclerView;
import androidx.appcompat.widget.PopupMenu;

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.core.common.result.AppError;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.result.AppResult;
import com.dangngulon.frontend.core.common.ui.helpers.AvatarImageLoader;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.utils.enums.AttachmentType;
import com.dangngulon.frontend.databinding.FragmentChatDetailBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.AttachmentUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageCursorPageUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;
import com.dangngulon.frontend.feature.zola.presentation.ui.adapters.ChatDayHeaderDecoration;
import com.dangngulon.frontend.feature.zola.presentation.ui.adapters.MessageAdapter;
import com.dangngulon.frontend.feature.zola.presentation.viewmodel.ChatDetailViewModel;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.BaseTransientBottomBar;
import com.google.android.material.snackbar.Snackbar;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ChatDetailFragment extends Fragment {
    private static final String ARG_AVATAR_URL = "avatarUrl";
    private static final String ARG_NICKNAME = "nickname";
    private static final String ARG_CONVERSATION_ID = "conversationId";
    private static final long MAX_UPLOAD_BYTES = 20L * 1024L * 1024L;
    private static final int MAX_RENDERED_MESSAGES = 300;
    private static final int AUTO_SCROLL_THRESHOLD = 3;
    private static final int LOAD_MORE_TRIGGER_POSITION = 2;
    private static final int MENU_ID_SAVE_IMAGE = 1;
    private static final String[] QUICK_EMOJIS = {
            "\uD83D\uDE03", // smiling face
            "\uD83D\uDE02", // face with tears of joy
            "\uD83E\uDD70", // smiling face with hearts
            "\uD83D\uDE0E", // smiling face with sunglasses
            "\uD83D\uDE0D", // smiling face with heart-eyes
            "\uD83D\uDE22", // crying face
            "\uD83D\uDC4D", // thumbs up
            "\u2764\uFE0F", // red heart
            "\uD83D\uDE4F", // folded hands
            "\uD83D\uDD25"  // fire
    };

    private FragmentChatDetailBinding binding;
    private ChatDetailViewModel viewModel;
    private MessageAdapter messageAdapter;
    private LinearLayoutManager messageLayoutManager;
    private RecyclerView.ItemDecoration dayHeaderDecoration;
    private Integer previousSoftInputMode;
    private ActivityResultLauncher<String> imagePickerLauncher;
    private ActivityResultLauncher<Void> cameraPreviewLauncher;
    private ActivityResultLauncher<String> audioPermissionLauncher;
    private ActivityResultLauncher<String> cameraPermissionLauncher;
    private MediaRecorder activeMediaRecorder;
    private File activeVoiceFile;
    private boolean isVoiceRecording;
    private boolean pendingStartVoiceRecording;
    private boolean isLoadingMoreMessages;
    private boolean hasMoreMessages = true;
    private final List<PendingImageAttachment> pendingImageAttachments = new ArrayList<>();

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initActivityResultLaunchers();
    }

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
        observeViewModel();
        requestMessages();
    }

    @Override
    public void onStart() {
        super.onStart();
        viewModel.subscribeMessages();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyResizeForKeyboard();
    }

    @Override
    public void onPause() {
        restoreSoftInputMode();
        super.onPause();
    }

    @Override
    public void onStop() {
        stopVoiceRecordingInternal(false);
        viewModel.unsubscribeMessages();
        super.onStop();
    }

    @Override
    public void onDestroyView() {
        binding.edtMessage.removeTextChangedListener(messageInputWatcher);
        pendingImageAttachments.clear();
        if (dayHeaderDecoration != null) {
            binding.rvMessages.removeItemDecoration(dayHeaderDecoration);
            dayHeaderDecoration = null;
        }
        binding.rvMessages.setAdapter(null);
        binding = null;
        super.onDestroyView();
    }

    private void initViewModel() {
        viewModel = new ViewModelProvider(this).get(ChatDetailViewModel.class);
    }

    private void readArguments() {
        Bundle args = getArguments();
        if (args == null) {
            return;
        }

        String conversationId = args.getString(ARG_CONVERSATION_ID);
        viewModel.setConversationId(conversationId);

        String username = args.getString(ARG_NICKNAME, "Unknown");
        binding.txtUsername.setText(username);

        String avatarUrl = args.getString(ARG_AVATAR_URL);
        loadAvatar(avatarUrl);
    }

    private void loadAvatar(String avatarUrl) {
        AvatarImageLoader.load(binding.imgAvatar, avatarUrl);
    }

    private void setupRecyclerView() {
        if (messageAdapter == null) {
            messageAdapter = new MessageAdapter();
        }

        messageAdapter.setMaxMessageCount(MAX_RENDERED_MESSAGES);
        messageAdapter.setCurrentUserId(viewModel.getCurrentUserId());
        messageAdapter.setOnMessageClickListener(new MessageAdapter.OnMessageClickListener() {
            @Override
            public void onMessageClick(MessageUiModel message) {
                if (!isUiReady() || message == null) {
                    return;
                }

                List<AttachmentUiModel> imageAttachments = MessageAdapter.getImageAttachments(message);
                if (!imageAttachments.isEmpty()) {
                    showImageGallery(imageAttachments);
                }
            }

            @Override
            public void onMessageLongClick(MessageUiModel message) {
                // Reserved for message options.
            }
        });

        messageLayoutManager = new LinearLayoutManager(requireContext());
        messageLayoutManager.setStackFromEnd(true);

        binding.rvMessages.setLayoutManager(messageLayoutManager);
        binding.rvMessages.setHasFixedSize(true);
        binding.rvMessages.setAdapter(messageAdapter);
        binding.rvMessages.clearOnScrollListeners();
        binding.rvMessages.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);
                if (dy < 0) {
                    maybeLoadMoreMessages();
                }
            }
        });

        if (dayHeaderDecoration == null) {
            dayHeaderDecoration = new ChatDayHeaderDecoration(requireContext());
            binding.rvMessages.addItemDecoration(dayHeaderDecoration);
        }
    }

    private void setupEvents() {
        binding.btnBack.setOnClickListener(v -> navigateBack());
        binding.btnEmoji.setOnClickListener(v -> showQuickEmojiPicker());
        binding.btnAttach.setOnClickListener(v -> openAttachmentPicker());
        binding.btnCamera.setOnClickListener(v -> handleCameraAction());
        binding.btnCall.setOnClickListener(v -> showCallComingSoon(false));
        binding.btnVideoCall.setOnClickListener(v -> showCallComingSoon(true));

        requireActivity().getOnBackPressedDispatcher().addCallback(
                getViewLifecycleOwner(),
                new OnBackPressedCallback(true) {
                    @Override
                    public void handleOnBackPressed() {
                        navigateBack();
                    }
                }
        );

        binding.edtMessage.addTextChangedListener(messageInputWatcher);
        renderPendingImagePreviews();
        updateActionButtonState(binding.edtMessage.getText());

        binding.btnMic.setOnClickListener(v -> handlePrimaryActionClick());
        binding.edtMessage.setOnEditorActionListener(this::onEditorAction);
    }

    private final TextWatcher messageInputWatcher = new TextWatcher() {
        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
        }

        @Override
        public void afterTextChanged(Editable s) {
            updateActionButtonState(s);
        }
    };

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
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    showLoading(true);
                    break;

                case SUCCESS:
                    showLoading(false);
                    MessageCursorPageUiModel data = result.getData();
                    if (data != null) {
                        List<MessageUiModel> messages = new ArrayList<>(data.getMessages());
                        Collections.reverse(messages);
                        messageAdapter.submitMessages(messages, this::scrollToBottom);
                        viewModel.setCurrentMessages(data);
                        updateHasMoreMessages(data);
                    }
                    isLoadingMoreMessages = false;
                    break;

                case ERROR:
                    showLoading(false);
                    isLoadingMoreMessages = false;
                    UiHelper.showToast(requireContext(), result.getMessage());
                    showError(result.getMessage());
                    break;
            }
        });
    }

    private void observeSendMessage() {
        viewModel.getMessages().observe(getViewLifecycleOwner(), message -> {
            boolean shouldAutoScroll = isNearBottom(AUTO_SCROLL_THRESHOLD);
            messageAdapter.add(message, shouldAutoScroll ? this::scrollToBottom : null);
        });

        viewModel.getSendMessageResult().observe(getViewLifecycleOwner(), result -> {
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    setSendingEnabled(false);
                    break;

                case SUCCESS:
                    setSendingEnabled(true);
                    break;

                case ERROR:
                    setSendingEnabled(true);
                    showError(result.getMessage());
                    break;
            }
        });
    }

    private void observeLoadMoreMessages() {
        viewModel.getLoadMoreMessagesResult().observe(getViewLifecycleOwner(), result -> {
            if (result == null) {
                return;
            }

            switch (result.getStatus()) {
                case LOADING:
                    isLoadingMoreMessages = true;
                    break;

                case SUCCESS:
                    isLoadingMoreMessages = false;
                    MessageCursorPageUiModel data = result.getData();
                    if (data != null && data.getMessages() != null) {
                        updateHasMoreMessages(data);

                        List<MessageUiModel> newMessages = new ArrayList<>(data.getMessages());
                        Collections.reverse(newMessages);
                        if (newMessages.isEmpty()) {
                            viewModel.setCurrentMessages(data);
                            break;
                        }

                        List<MessageUiModel> currentMessages = messageAdapter.getCurrentList();
                        int firstVisiblePosition = RecyclerView.NO_POSITION;
                        int firstVisibleTopOffset = 0;
                        if (messageLayoutManager != null) {
                            firstVisiblePosition = messageLayoutManager.findFirstVisibleItemPosition();
                            View firstVisibleView = messageLayoutManager.findViewByPosition(firstVisiblePosition);
                            if (firstVisibleView != null) {
                                firstVisibleTopOffset = firstVisibleView.getTop();
                            }
                        }

                        List<MessageUiModel> allMessages = new ArrayList<>();
                        allMessages.addAll(newMessages);
                        allMessages.addAll(currentMessages);

                        int insertedCount = newMessages.size();
                        int restoredPosition = firstVisiblePosition;
                        int restoredOffset = firstVisibleTopOffset;
                        messageAdapter.submitMessages(allMessages, () -> restorePrependScrollPosition(
                                restoredPosition,
                                restoredOffset,
                                insertedCount
                        ));
                        viewModel.setCurrentMessages(data);
                    }
                    break;

                case ERROR:
                    isLoadingMoreMessages = false;
                    showError(result.getMessage());
                    break;
            }
        });
    }

    private void requestMessages() {
        isLoadingMoreMessages = false;
        hasMoreMessages = true;
        viewModel.loadInitialMessages();
    }

    private void sendMessageIfPossible() {
        String text = getInputText();
        boolean hasPendingImages = hasPendingImages();

        if (TextUtils.isEmpty(text) && !hasPendingImages) {
            return;
        }

        if (!hasPendingImages) {
            boolean sent = viewModel.sendMessageRealTime(text);
            if (sent) {
                binding.edtMessage.setText("");
            }
            return;
        }

        sendPendingImagesWithOptionalText(text);
    }

    private void handlePrimaryActionClick() {
        String text = getInputText();
        if (!TextUtils.isEmpty(text) || hasPendingImages()) {
            sendMessageIfPossible();
            return;
        }

        handleVoiceAction();
    }

    private void handleVoiceAction() {
        if (isVoiceRecording) {
            stopVoiceRecordingAndSend();
            return;
        }

        startVoiceRecordingOrRequestPermission();
    }

    private void startVoiceRecordingOrRequestPermission() {
        if (!isUiReady()) {
            return;
        }

        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            pendingStartVoiceRecording = true;
            if (audioPermissionLauncher != null) {
                audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
            }
            return;
        }

        startVoiceRecordingInternal();
    }

    private void startVoiceRecordingInternal() {
        if (!isUiReady()) {
            return;
        }

        if (isVoiceRecording) {
            return;
        }

        try {
            File outputFile = new File(
                    requireContext().getCacheDir(),
                    "voice_" + System.currentTimeMillis() + ".m4a"
            );

            MediaRecorder recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioSamplingRate(44100);
            recorder.setAudioEncodingBitRate(96000);
            recorder.setOutputFile(outputFile.getAbsolutePath());
            recorder.prepare();
            recorder.start();

            activeMediaRecorder = recorder;
            activeVoiceFile = outputFile;
            isVoiceRecording = true;
            pendingStartVoiceRecording = false;
            updateActionButtonState(binding.edtMessage.getText());
            UiHelper.showToast(requireContext(), R.string.chat_detail_recording_started);
        } catch (Exception exception) {
            releaseRecorderSafely(activeMediaRecorder);
            activeMediaRecorder = null;
            activeVoiceFile = null;
            isVoiceRecording = false;
            pendingStartVoiceRecording = false;
            updateActionButtonState(binding.edtMessage.getText());
            showError(getString(R.string.chat_detail_recording_failed));
        }
    }

    private void stopVoiceRecordingAndSend() {
        LocalAttachmentPayload payload = stopVoiceRecordingInternal(true);
        if (payload == null) {
            showError(getString(R.string.chat_detail_recording_failed));
            return;
        }

        setSendingEnabled(false);
        sendPreparedAttachment(payload, AttachmentType.AUDIO);
    }

    @Nullable
    private LocalAttachmentPayload stopVoiceRecordingInternal(boolean createPayload) {
        MediaRecorder recorder = activeMediaRecorder;
        File recordingFile = activeVoiceFile;

        activeMediaRecorder = null;
        activeVoiceFile = null;
        isVoiceRecording = false;
        pendingStartVoiceRecording = false;
        if (isUiReady()) {
            updateActionButtonState(binding.edtMessage.getText());
        }

        boolean stoppedSuccessfully = true;
        if (recorder != null) {
            try {
                recorder.stop();
            } catch (Exception ignored) {
                stoppedSuccessfully = false;
            } finally {
                releaseRecorderSafely(recorder);
            }
        }

        if (!createPayload || recordingFile == null) {
            return null;
        }

        if (!stoppedSuccessfully) {
            deleteFileQuietly(recordingFile);
            return null;
        }

        LocalAttachmentPayload payload = createPayloadFromFile(recordingFile, "audio/mp4");
        deleteFileQuietly(recordingFile);
        return payload;
    }

    private void releaseRecorderSafely(@Nullable MediaRecorder recorder) {
        if (recorder == null) {
            return;
        }

        try {
            recorder.reset();
        } catch (Exception ignored) {
        }

        try {
            recorder.release();
        } catch (Exception ignored) {
        }
    }

    private void deleteFileQuietly(@Nullable File file) {
        if (file == null) {
            return;
        }

        try {
            if (file.exists()) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        } catch (Exception ignored) {
        }
    }

    private void initActivityResultLaunchers() {
        imagePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.GetMultipleContents(),
                this::handleImagesSelected
        );

        cameraPreviewLauncher = registerForActivityResult(
                new ActivityResultContracts.TakePicturePreview(),
                this::handlePhotoCaptured
        );

        cameraPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> {
                    if (granted) {
                        launchCameraPreview();
                        return;
                    }

                    if (!isUiReady()) {
                        return;
                    }
                    UiHelper.showToast(requireContext(), R.string.chat_detail_camera_permission_denied);
                }
        );

        audioPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> runOnMainThread(() -> {
                    if (!isUiReady()) {
                        return;
                    }

                    if (granted) {
                        if (pendingStartVoiceRecording) {
                            pendingStartVoiceRecording = false;
                            startVoiceRecordingInternal();
                        }
                        return;
                    }

                    pendingStartVoiceRecording = false;
                    UiHelper.showToast(requireContext(), R.string.chat_detail_audio_permission_denied);
                })
        );
    }

    private void showQuickEmojiPicker() {
        if (!isUiReady()) {
            return;
        }

        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.chat_detail_emoji_picker_title)
                .setItems(QUICK_EMOJIS, (dialog, which) -> appendToMessageInput(QUICK_EMOJIS[which]))
                .show();
    }

    private void appendToMessageInput(String value) {
        if (!isUiReady()) {
            return;
        }

        Editable current = binding.edtMessage.getText();
        if (current == null) {
            return;
        }

        int selectionStart = Math.max(binding.edtMessage.getSelectionStart(), 0);
        int selectionEnd = Math.max(binding.edtMessage.getSelectionEnd(), 0);
        int start = Math.min(selectionStart, selectionEnd);
        int end = Math.max(selectionStart, selectionEnd);

        current.replace(start, end, value);
        binding.edtMessage.requestFocus();
        binding.edtMessage.setSelection(start + value.length());
    }

    private void openAttachmentPicker() {
        if (imagePickerLauncher == null) {
            return;
        }
        imagePickerLauncher.launch("image/*");
    }

    private void handleImagesSelected(@Nullable List<Uri> imageUris) {
        if (!isUiReady()) {
            return;
        }

        if (imageUris == null || imageUris.isEmpty()) {
            UiHelper.showToast(requireContext(), R.string.chat_detail_image_picker_empty);
            return;
        }

        for (Uri uri : imageUris) {
            if (uri == null) {
                continue;
            }
            addPendingImageFromUri(uri);
        }

        renderPendingImagePreviews();
    }

    private boolean hasPendingImages() {
        return !pendingImageAttachments.isEmpty();
    }

    private void addPendingImageFromUri(@NonNull Uri uri) {
        String uriValue = uri.toString();
        for (PendingImageAttachment attachment : pendingImageAttachments) {
            if (uriValue.equals(attachment.sourceKey)) {
                return;
            }
        }

        String fileName = resolveDisplayName(uri, "image_" + System.currentTimeMillis() + ".jpg");
        String contentType = resolveContentType(uri, "image/jpeg");
        long fileSize = resolveFileSize(uri);

        pendingImageAttachments.add(
                PendingImageAttachment.fromUri(uri, fileName, contentType, fileSize, uriValue)
        );
    }

    private void renderPendingImagePreviews() {
        if (!isUiReady()) {
            return;
        }

        binding.pendingImagesContainer.removeAllViews();

        if (pendingImageAttachments.isEmpty()) {
            binding.pendingImagesScroll.setVisibility(View.GONE);
            updateActionButtonState(binding.edtMessage.getText());
            return;
        }

        binding.pendingImagesScroll.setVisibility(View.VISIBLE);

        for (int i = 0; i < pendingImageAttachments.size(); i++) {
            PendingImageAttachment attachment = pendingImageAttachments.get(i);
            int removeIndex = i;

            FrameLayout previewRoot = new FrameLayout(requireContext());
            LinearLayout.LayoutParams rootParams = new LinearLayout.LayoutParams(dp(56), dp(56));
            rootParams.setMarginStart(dp(4));
            rootParams.setMarginEnd(dp(4));
            previewRoot.setLayoutParams(rootParams);

            ImageView imageView = new ImageView(requireContext());
            FrameLayout.LayoutParams imageParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            );
            imageView.setLayoutParams(imageParams);
            imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
            imageView.setBackgroundResource(R.drawable.bg_chat_input);

            Object previewSource = attachment.resolvePreviewSource();
            Glide.with(imageView)
                    .load(previewSource)
                    .placeholder(R.drawable.default_avatar)
                    .error(R.drawable.default_avatar)
                    .into(imageView);

            ImageButton removeButton = new ImageButton(requireContext());
            FrameLayout.LayoutParams removeParams = new FrameLayout.LayoutParams(dp(18), dp(18));
            removeParams.gravity = android.view.Gravity.END | android.view.Gravity.TOP;
            removeButton.setLayoutParams(removeParams);
            removeButton.setBackgroundResource(R.drawable.ripple_circle);
            removeButton.setImageResource(R.drawable.ic_close);
            removeButton.setScaleType(ImageView.ScaleType.CENTER);
            removeButton.setContentDescription(getString(R.string.chat_detail_pending_image_remove));
            removeButton.setOnClickListener(v -> {
                if (removeIndex < 0 || removeIndex >= pendingImageAttachments.size()) {
                    return;
                }
                pendingImageAttachments.remove(removeIndex);
                renderPendingImagePreviews();
            });

            previewRoot.addView(imageView);
            previewRoot.addView(removeButton);
            binding.pendingImagesContainer.addView(previewRoot);
        }

        updateActionButtonState(binding.edtMessage.getText());
    }

    private int dp(int value) {
        return Math.round(value * requireContext().getResources().getDisplayMetrics().density);
    }

    private void sendPendingImagesWithOptionalText(String textContent) {
        if (!isUiReady()) {
            return;
        }

        List<PendingImageAttachment> snapshot = new ArrayList<>(pendingImageAttachments);
        if (snapshot.isEmpty()) {
            return;
        }

        setSendingEnabled(false);

        CompletableFuture.supplyAsync(() -> buildPendingImagePayloads(snapshot))
                .thenCompose(payloadResult -> {
                    if (payloadResult.errorMessage != null) {
                        return CompletableFuture.completedFuture(
                                AppResult.error(new AppError(payloadResult.errorMessage))
                        );
                    }
                    return uploadPendingImagePayloads(payloadResult.payloads);
                })
                .whenComplete((uploadResult, throwable) -> runOnMainThread(() -> {
                    if (!isUiReady()) {
                        return;
                    }

                    setSendingEnabled(true);

                    if (throwable != null) {
                        showError(getString(R.string.chat_detail_image_send_failed));
                        return;
                    }

                    if (uploadResult instanceof AppResult.Error<List<AttachmentUiModel>> error) {
                        showError(error.getError().getMessage());
                        return;
                    }

                    List<AttachmentUiModel> uploadedAttachments = List.of();
                    if (uploadResult instanceof AppResult.Success<List<AttachmentUiModel>> success
                            && success.getData() != null) {
                        uploadedAttachments = success.getData();
                    }

                    viewModel.sendMessageAsync(textContent, uploadedAttachments)
                            .whenComplete((sendResult, sendThrowable) -> runOnMainThread(() -> {
                                if (!isUiReady()) {
                                    return;
                                }

                                if (sendThrowable != null) {
                                    showError(getString(R.string.chat_detail_image_send_failed));
                                    return;
                                }

                                if (sendResult instanceof AppResult.Error<MessageUiModel> error) {
                                    showError(error.getError().getMessage());
                                    return;
                                }

                                if (sendResult instanceof AppResult.Success<MessageUiModel> successResult
                                        && successResult.getData() != null) {
                                    messageAdapter.add(successResult.getData(), this::scrollToBottom);
                                }

                                pendingImageAttachments.clear();
                                binding.edtMessage.setText("");
                                renderPendingImagePreviews();
                            }));
                }));
    }

    private PendingPayloadResult buildPendingImagePayloads(@NonNull List<PendingImageAttachment> attachments) {
        List<LocalAttachmentPayload> payloads = new ArrayList<>();

        for (PendingImageAttachment pending : attachments) {
            LocalAttachmentPayload payload;
            if (pending.cachedPayload != null) {
                payload = pending.cachedPayload;
            } else {
                payload = createPayloadFromUri(pending.uri, pending.contentType);
            }

            if (payload == null) {
                return PendingPayloadResult.error(getString(R.string.chat_detail_image_read_failed));
            }

            if (payload.fileSize > MAX_UPLOAD_BYTES) {
                return PendingPayloadResult.error(getString(R.string.chat_detail_file_too_large));
            }

            payloads.add(payload);
        }

        return PendingPayloadResult.success(payloads);
    }

    private CompletableFuture<AppResult<List<AttachmentUiModel>>> uploadPendingImagePayloads(
            @NonNull List<LocalAttachmentPayload> payloads
    ) {
        return uploadPendingImagePayloads(payloads, 0, new ArrayList<>());
    }

    private CompletableFuture<AppResult<List<AttachmentUiModel>>> uploadPendingImagePayloads(
            @NonNull List<LocalAttachmentPayload> payloads,
            int index,
            @NonNull List<AttachmentUiModel> uploadedAttachments
    ) {
        if (index >= payloads.size()) {
            return CompletableFuture.completedFuture(AppResult.success(uploadedAttachments));
        }

        LocalAttachmentPayload current = payloads.get(index);
        return viewModel.uploadAttachment(current.bytes, current.fileName, current.contentType)
                .thenCompose(uploadResult -> {
                    if (uploadResult instanceof AppResult.Error<String> error) {
                        return CompletableFuture.completedFuture(AppResult.error(error.getError()));
                    }

                    if (!(uploadResult instanceof AppResult.Success<String> success)) {
                        return CompletableFuture.completedFuture(
                                AppResult.error(new AppError(getString(R.string.chat_detail_upload_failed)))
                        );
                    }

                    String uploadedUrl = success.getData();
                    if (TextUtils.isEmpty(uploadedUrl)) {
                        return CompletableFuture.completedFuture(
                                AppResult.error(new AppError(getString(R.string.chat_detail_upload_failed)))
                        );
                    }

                    uploadedAttachments.add(new AttachmentUiModel(
                            null,
                            uploadedUrl,
                            AttachmentType.IMAGE,
                            current.fileName,
                            current.fileSize,
                            current.contentType
                    ));

                    return uploadPendingImagePayloads(payloads, index + 1, uploadedAttachments);
                });
    }

    private void sendPreparedAttachment(
            @NonNull LocalAttachmentPayload payload,
            @NonNull AttachmentType attachmentType
    ) {
        if (payload.fileSize > MAX_UPLOAD_BYTES) {
            setSendingEnabled(true);
            showError(getString(R.string.chat_detail_file_too_large));
            return;
        }

        viewModel.sendAttachmentMessage(
                        payload.bytes,
                        payload.fileName,
                        payload.contentType,
                        attachmentType
                )
                .whenComplete((result, throwable) -> runOnMainThread(() -> {
                    if (!isUiReady()) {
                        return;
                    }

                    setSendingEnabled(true);

                    if (throwable != null) {
                        showError(getString(R.string.chat_detail_upload_failed));
                        return;
                    }

                    if (result instanceof AppResult.Error<Void> error) {
                        showError(error.getError().getMessage());
                    }
                }));
    }

    @Nullable
    private LocalAttachmentPayload createPayloadFromUri(@NonNull Uri uri, @NonNull String fallbackContentType) {
        String fileName = resolveDisplayName(uri, getString(R.string.chat_detail_unknown_file));
        String contentType = resolveContentType(uri, fallbackContentType);
        long fileSize = resolveFileSize(uri);

        byte[] bytes = readAllBytesFromUri(uri);
        if (bytes == null || bytes.length == 0) {
            return null;
        }

        if (fileSize <= 0) {
            fileSize = bytes.length;
        }

        return new LocalAttachmentPayload(bytes, fileName, contentType, fileSize);
    }

    @Nullable
    private LocalAttachmentPayload createPayloadFromBitmap(@NonNull Bitmap bitmap) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            boolean compressed = bitmap.compress(Bitmap.CompressFormat.JPEG, 92, outputStream);
            if (!compressed) {
                return null;
            }

            byte[] bytes = outputStream.toByteArray();
            if (bytes.length == 0) {
                return null;
            }

            String fileName = "photo_" + System.currentTimeMillis() + ".jpg";
            return new LocalAttachmentPayload(bytes, fileName, "image/jpeg", bytes.length);
        } catch (Exception ignored) {
            return null;
        }
    }

    @Nullable
    private LocalAttachmentPayload createPayloadFromFile(@NonNull File sourceFile, @NonNull String contentType) {
        try (FileInputStream inputStream = new FileInputStream(sourceFile);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }

            byte[] bytes = outputStream.toByteArray();
            if (bytes.length == 0) {
                return null;
            }

            return new LocalAttachmentPayload(
                    bytes,
                    sourceFile.getName(),
                    contentType,
                    bytes.length
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    @Nullable
    private byte[] readAllBytesFromUri(@NonNull Uri uri) {
        try (InputStream inputStream = requireContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            if (inputStream == null) {
                return null;
            }

            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            return outputStream.toByteArray();
        } catch (Exception ignored) {
            return null;
        }
    }

    private long resolveFileSize(@NonNull Uri uri) {
        Cursor cursor = null;
        try {
            cursor = requireContext().getContentResolver().query(
                    uri,
                    new String[]{OpenableColumns.SIZE},
                    null,
                    null,
                    null
            );

            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (index >= 0) {
                    return cursor.getLong(index);
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return -1L;
    }

    private String resolveContentType(@NonNull Uri uri, @NonNull String fallback) {
        String resolved = null;
        try {
            resolved = requireContext().getContentResolver().getType(uri);
        } catch (Exception ignored) {
        }

        return TextUtils.isEmpty(resolved) ? fallback : resolved;
    }

    private void runOnMainThread(@NonNull Runnable action) {
        if (!isAdded()) {
            return;
        }

        requireActivity().runOnUiThread(action);
    }

    private static final class LocalAttachmentPayload {
        private final byte[] bytes;
        private final String fileName;
        private final String contentType;
        private final long fileSize;

        private LocalAttachmentPayload(
                byte[] bytes,
                String fileName,
                String contentType,
                long fileSize
        ) {
            this.bytes = bytes;
            this.fileName = fileName;
            this.contentType = contentType;
            this.fileSize = fileSize;
        }
    }

    private static final class PendingImageAttachment {
        @Nullable
        private final Uri uri;
        @Nullable
        private final LocalAttachmentPayload cachedPayload;
        private final String fileName;
        private final String contentType;
        private final long fileSize;
        private final String sourceKey;

        private PendingImageAttachment(
                @Nullable Uri uri,
                @Nullable LocalAttachmentPayload cachedPayload,
                String fileName,
                String contentType,
                long fileSize,
                String sourceKey
        ) {
            this.uri = uri;
            this.cachedPayload = cachedPayload;
            this.fileName = fileName;
            this.contentType = contentType;
            this.fileSize = fileSize;
            this.sourceKey = sourceKey;
        }

        private static PendingImageAttachment fromUri(
                @NonNull Uri uri,
                @NonNull String fileName,
                @NonNull String contentType,
                long fileSize,
                @NonNull String sourceKey
        ) {
            return new PendingImageAttachment(uri, null, fileName, contentType, fileSize, sourceKey);
        }

        private static PendingImageAttachment fromPayload(@NonNull LocalAttachmentPayload payload) {
            return new PendingImageAttachment(
                    null,
                    payload,
                    payload.fileName,
                    payload.contentType,
                    payload.fileSize,
                    payload.fileName + "_" + payload.fileSize + "_" + System.currentTimeMillis()
            );
        }

        private Object resolvePreviewSource() {
            if (uri != null) {
                return uri;
            }

            if (cachedPayload != null) {
                return cachedPayload.bytes;
            }

            return null;
        }
    }

    private static final class PendingPayloadResult {
        @NonNull
        private final List<LocalAttachmentPayload> payloads;
        @Nullable
        private final String errorMessage;

        private PendingPayloadResult(@NonNull List<LocalAttachmentPayload> payloads, @Nullable String errorMessage) {
            this.payloads = payloads;
            this.errorMessage = errorMessage;
        }

        private static PendingPayloadResult success(@NonNull List<LocalAttachmentPayload> payloads) {
            return new PendingPayloadResult(payloads, null);
        }

        private static PendingPayloadResult error(@NonNull String message) {
            return new PendingPayloadResult(List.of(), message);
        }
    }

    private void handleCameraAction() {
        if (!isUiReady()) {
            return;
        }

        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            launchCameraPreview();
            return;
        }

        if (cameraPermissionLauncher != null) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    private void launchCameraPreview() {
        if (!isUiReady() || cameraPreviewLauncher == null) {
            return;
        }

        try {
            cameraPreviewLauncher.launch(null);
        } catch (ActivityNotFoundException ex) {
            UiHelper.showToast(requireContext(), R.string.chat_detail_camera_not_available);
        }
    }

    private void handlePhotoCaptured(@Nullable Bitmap bitmap) {
        if (!isUiReady() || bitmap == null) {
            return;
        }

        CompletableFuture.supplyAsync(() -> createPayloadFromBitmap(bitmap))
                .whenComplete((payload, throwable) -> runOnMainThread(() -> {
                    if (!isUiReady()) {
                        return;
                    }

                    if (throwable != null || payload == null) {
                        showError(getString(R.string.chat_detail_file_read_failed));
                        return;
                    }

                    pendingImageAttachments.add(PendingImageAttachment.fromPayload(payload));
                    renderPendingImagePreviews();
                }));
    }

    private void showImageGallery(@NonNull List<AttachmentUiModel> imageAttachments) {
        if (!isUiReady() || imageAttachments.isEmpty()) {
            return;
        }

        List<String> imageUrls = new ArrayList<>();
        for (AttachmentUiModel attachment : imageAttachments) {
            if (attachment == null || TextUtils.isEmpty(attachment.getUrl())) {
                continue;
            }
            imageUrls.add(attachment.getUrl());
        }

        if (imageUrls.isEmpty()) {
            return;
        }

        Dialog dialog = new Dialog(requireContext(), android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        FrameLayout dialogRoot = new FrameLayout(requireContext());
        View dialogView = LayoutInflater.from(requireContext())
                .inflate(R.layout.dialog_chat_image_viewer_fullscreen, dialogRoot, false);

        ImageButton closeButton = dialogView.findViewById(R.id.btnCloseImageViewer);
        ImageButton moreButton = dialogView.findViewById(R.id.btnMoreImageViewer);
        RecyclerView imageViewerRecyclerView = dialogView.findViewById(R.id.rvImageViewer);
        TextView counterTextView = dialogView.findViewById(R.id.txtImageCounter);

        LinearLayoutManager horizontalLayoutManager = new LinearLayoutManager(
                requireContext(),
                LinearLayoutManager.HORIZONTAL,
                false
        );
        imageViewerRecyclerView.setLayoutManager(horizontalLayoutManager);
        imageViewerRecyclerView.setAdapter(new FullscreenImageAdapter(imageUrls));

        PagerSnapHelper pagerSnapHelper = new PagerSnapHelper();
        pagerSnapHelper.attachToRecyclerView(imageViewerRecyclerView);

        int[] currentIndex = new int[]{0};
        updateImageCounter(counterTextView, currentIndex[0], imageUrls.size());

        imageViewerRecyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(@NonNull RecyclerView recyclerView, int newState) {
                super.onScrollStateChanged(recyclerView, newState);
                if (newState != RecyclerView.SCROLL_STATE_IDLE) {
                    return;
                }

                View snappedView = pagerSnapHelper.findSnapView(horizontalLayoutManager);
                if (snappedView == null) {
                    return;
                }

                int adapterPosition = horizontalLayoutManager.getPosition(snappedView);
                if (adapterPosition < 0 || adapterPosition >= imageUrls.size()) {
                    return;
                }

                currentIndex[0] = adapterPosition;
                updateImageCounter(counterTextView, currentIndex[0], imageUrls.size());
            }
        });

        closeButton.setOnClickListener(v -> dialog.dismiss());
        moreButton.setOnClickListener(v -> showImageViewerMenu(v, imageUrls, currentIndex[0]));

        dialog.setContentView(dialogView);
        if (dialog.getWindow() != null) {
            dialog.getWindow().setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
        }
        dialog.show();
    }

    private void showImageViewerMenu(
            @NonNull View anchor,
            @NonNull List<String> imageUrls,
            int currentIndex
    ) {
        if (!isUiReady() || imageUrls.isEmpty()) {
            return;
        }

        int safeIndex = Math.max(0, Math.min(currentIndex, imageUrls.size() - 1));
        String selectedImageUrl = imageUrls.get(safeIndex);

        PopupMenu popupMenu = new PopupMenu(requireContext(), anchor);
        popupMenu.getMenu().add(0, MENU_ID_SAVE_IMAGE, 0, getString(R.string.chat_detail_save_image));
        popupMenu.setOnMenuItemClickListener(item -> {
            if (item.getItemId() != MENU_ID_SAVE_IMAGE) {
                return false;
            }

            saveImageToDevice(selectedImageUrl);
            return true;
        });
        popupMenu.show();
    }

    private void saveImageToDevice(@Nullable String imageUrl) {
        if (!isUiReady() || TextUtils.isEmpty(imageUrl)) {
            showError(getString(R.string.chat_detail_save_image_failed));
            return;
        }

        DownloadManager downloadManager = (DownloadManager) requireContext()
                .getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) {
            showError(getString(R.string.chat_detail_save_image_failed));
            return;
        }

        String fileName = buildDownloadFileName(imageUrl);

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(imageUrl));
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setTitle(fileName);
        request.setDescription(getString(R.string.chat_detail_downloading_image));
        request.setMimeType("image/*");
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);

        try {
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
        } catch (Exception ignored) {
            // Fall back to DownloadManager default destination.
        }

        try {
            downloadManager.enqueue(request);
            UiHelper.showToast(requireContext(), R.string.chat_detail_save_image_started);
        } catch (Exception exception) {
            showError(getString(R.string.chat_detail_save_image_failed));
        }
    }

    @NonNull
    private String buildDownloadFileName(@Nullable String imageUrl) {
        String defaultName = "chat_image_" + System.currentTimeMillis() + ".jpg";
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return defaultName;
        }

        try {
            Uri parsedUri = Uri.parse(imageUrl);
            String lastSegment = parsedUri.getLastPathSegment();
            if (lastSegment == null || lastSegment.trim().isEmpty()) {
                return defaultName;
            }

            String sanitized = lastSegment.trim();
            int queryIndex = sanitized.indexOf('?');
            if (queryIndex >= 0) {
                sanitized = sanitized.substring(0, queryIndex);
            }

            if (sanitized.isEmpty()) {
                return defaultName;
            }

            if (sanitized.contains(".")) {
                return sanitized;
            }

            return sanitized + ".jpg";
        } catch (Exception ignored) {
            return defaultName;
        }
    }

    private void updateImageCounter(@NonNull TextView counterTextView, int currentIndex, int totalImages) {
        int currentDisplayIndex = Math.max(1, Math.min(currentIndex + 1, Math.max(totalImages, 1)));
        counterTextView.setText(getString(
                R.string.chat_detail_image_counter_format,
                currentDisplayIndex,
                Math.max(totalImages, 1)
        ));
    }

    private static final class FullscreenImageAdapter
            extends RecyclerView.Adapter<FullscreenImageAdapter.ImageViewHolder> {

        private final List<String> imageUrls;

        private FullscreenImageAdapter(@NonNull List<String> imageUrls) {
            this.imageUrls = imageUrls;
        }

        @NonNull
        @Override
        public ImageViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_chat_image_viewer_page, parent, false);
            return new ImageViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ImageViewHolder holder, int position) {
            String imageUrl = imageUrls.get(position);
            Glide.with(holder.imageView)
                    .load(imageUrl)
                    .placeholder(R.drawable.default_avatar)
                    .error(R.drawable.default_avatar)
                    .into(holder.imageView);
        }

        @Override
        public int getItemCount() {
            return imageUrls.size();
        }

        private static final class ImageViewHolder extends RecyclerView.ViewHolder {
            private final ImageView imageView;

            private ImageViewHolder(@NonNull View itemView) {
                super(itemView);
                imageView = itemView.findViewById(R.id.imgGalleryItem);
            }
        }
    }

    private String resolveDisplayName(@NonNull Uri uri, @NonNull String fallback) {
        Cursor cursor = null;
        try {
            cursor = requireContext().getContentResolver().query(
                    uri,
                    new String[]{OpenableColumns.DISPLAY_NAME},
                    null,
                    null,
                    null
            );

            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String name = cursor.getString(index);
                    if (!TextUtils.isEmpty(name)) {
                        return name;
                    }
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        String lastSegment = uri.getLastPathSegment();
        return TextUtils.isEmpty(lastSegment) ? fallback : lastSegment;
    }

    private void showCallComingSoon(boolean isVideoCall) {
        if (!isUiReady()) {
            return;
        }

        int messageRes = isVideoCall
                ? R.string.chat_detail_video_call_coming_soon
                : R.string.chat_detail_voice_call_coming_soon;
        UiHelper.showToast(requireContext(), messageRes);
    }

    private boolean isUiReady() {
        return isAdded() && binding != null;
    }

    private String getInputText() {
        CharSequence text = binding.edtMessage.getText();
        return text == null ? "" : text.toString().trim();
    }

    private void updateActionButtonState(CharSequence input) {
        boolean hasText = input != null && !input.toString().trim().isEmpty();
        boolean primaryAction = hasText || isVoiceRecording || hasPendingImages();
        binding.btnMic.setImageResource(primaryAction ? R.drawable.ic_send : R.drawable.ic_mic_dark);
        binding.btnMic.setBackgroundResource(primaryAction ? R.drawable.ripple_circle : R.drawable.bg_chat_mic_button);
    }

    private void setSendingEnabled(boolean enabled) {
        binding.btnMic.setEnabled(enabled);
        binding.edtMessage.setEnabled(enabled);
        binding.btnAttach.setEnabled(enabled);
        binding.btnCamera.setEnabled(enabled);
        binding.btnEmoji.setEnabled(enabled);
    }

    private void scrollToBottom() {
        int count = messageAdapter.getItemCount();
        if (count > 0) {
            binding.rvMessages.scrollToPosition(count - 1);
        }
    }

    private void maybeLoadMoreMessages() {
        if (!isUiReady() || messageLayoutManager == null) {
            return;
        }

        if (isLoadingMoreMessages || !hasMoreMessages) {
            return;
        }

        int firstVisiblePosition = messageLayoutManager.findFirstVisibleItemPosition();
        if (firstVisiblePosition == RecyclerView.NO_POSITION) {
            return;
        }

        if (firstVisiblePosition > LOAD_MORE_TRIGGER_POSITION) {
            return;
        }

        isLoadingMoreMessages = true;
        viewModel.loadMoreMessages();
    }

    private void restorePrependScrollPosition(
            int previousFirstVisiblePosition,
            int previousFirstVisibleTopOffset,
            int insertedCount
    ) {
        if (!isUiReady() || messageLayoutManager == null) {
            return;
        }

        if (previousFirstVisiblePosition == RecyclerView.NO_POSITION || insertedCount <= 0) {
            return;
        }

        int restoredPosition = previousFirstVisiblePosition + insertedCount;
        if (restoredPosition >= messageAdapter.getItemCount()) {
            restoredPosition = messageAdapter.getItemCount() - 1;
        }
        if (restoredPosition < 0) {
            restoredPosition = 0;
        }

        messageLayoutManager.scrollToPositionWithOffset(restoredPosition, previousFirstVisibleTopOffset);
    }

    private void updateHasMoreMessages(@Nullable MessageCursorPageUiModel data) {
        hasMoreMessages = data != null && data.getNextCursor() != null;
    }

    private boolean isNearBottom(int threshold) {
        RecyclerView.LayoutManager recyclerLayoutManager = binding.rvMessages.getLayoutManager();
        if (!(recyclerLayoutManager instanceof LinearLayoutManager linearLayoutManager)) {
            return true;
        }

        int lastVisiblePosition = linearLayoutManager.findLastVisibleItemPosition();
        if (lastVisiblePosition == RecyclerView.NO_POSITION) {
            return true;
        }

        int lastIndex = Math.max(0, messageAdapter.getItemCount() - 1);
        return lastVisiblePosition >= (lastIndex - Math.max(threshold, 0));
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
        binding.loadingOverlay.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    private void applyResizeForKeyboard() {
        if (getActivity() == null) {
            return;
        }

        WindowManager.LayoutParams params = getActivity().getWindow().getAttributes();
        if (previousSoftInputMode == null) {
            previousSoftInputMode = params.softInputMode;
        }

        getActivity().getWindow().setSoftInputMode(
                WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        );
    }

    private void restoreSoftInputMode() {
        if (getActivity() == null || previousSoftInputMode == null) {
            return;
        }

        getActivity().getWindow().setSoftInputMode(previousSoftInputMode);
        previousSoftInputMode = null;
    }
}
