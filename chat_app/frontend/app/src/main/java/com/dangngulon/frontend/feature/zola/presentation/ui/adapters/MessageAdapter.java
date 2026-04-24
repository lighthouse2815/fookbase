package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;
import com.dangngulon.frontend.core.utils.enums.AttachmentType;
import com.dangngulon.frontend.databinding.ItemChatMessageReceivedBinding;
import com.dangngulon.frontend.databinding.ItemChatMessageSentBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.AttachmentUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

public class MessageAdapter extends ListAdapter<MessageUiModel, MessageAdapter.ViewHolder> {
    private static final int VIEW_TYPE_SENT = 1;
    private static final int VIEW_TYPE_RECEIVED = 2;

    private String currentUserId;
    private OnMessageClickListener listener;

    public MessageAdapter() {
        super(new DiffUtil.ItemCallback<MessageUiModel>() {
            @Override
            public boolean areItemsTheSame(@NonNull MessageUiModel oldItem, @NonNull MessageUiModel newItem) {
                return Objects.equals(oldItem.getMessageId(), newItem.getMessageId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull MessageUiModel oldItem, @NonNull MessageUiModel newItem) {
                return Objects.equals(oldItem.getContent(), newItem.getContent()) &&
                        Objects.equals(oldItem.getStatus(), newItem.getStatus()) &&
                        Objects.equals(oldItem.getCreatedAt(), newItem.getCreatedAt()) &&
                        Objects.equals(oldItem.getAttachments(), newItem.getAttachments());
            }
        });
    }

    public interface OnMessageClickListener {
        void onMessageClick(MessageUiModel message);

        void onMessageLongClick(MessageUiModel message);
    }

    public void setOnMessageClickListener(OnMessageClickListener listener) {
        this.listener = listener;
    }

    public void setCurrentUserId(String currentUserId) {
        this.currentUserId = currentUserId;
    }

    public void submitMessages(List<MessageUiModel> messages) {
        submitMessages(messages, null);
    }

    public void submitMessages(List<MessageUiModel> messages, Runnable onCommitted) {
        submitList(messages, () -> {
            notifyDataSetChanged();
            if (onCommitted != null) {
                onCommitted.run();
            }
        });
    }

    public void add(MessageUiModel message) {
        add(message, null);
    }

    public void add(MessageUiModel message, Runnable onCommitted) {
        if (message == null) {
            return;
        }

        List<MessageUiModel> newList = new ArrayList<>(getCurrentList());
        String newMessageId = message.getMessageId();
        if (newMessageId != null) {
            for (MessageUiModel existing : newList) {
                if (existing == null) {
                    continue;
                }
                if (newMessageId.equals(existing.getMessageId())) {
                    if (onCommitted != null) {
                        onCommitted.run();
                    }
                    return;
                }
            }
        }

        newList.add(message);
        int previousLastIndex = newList.size() - 2;
        submitList(newList, () -> {
            if (previousLastIndex >= 0) {
                notifyItemChanged(previousLastIndex);
            }

            if (onCommitted != null) {
                onCommitted.run();
            }
        });
    }

    @Nullable
    public MessageUiModel getMessageAt(int position) {
        if (position < 0 || position >= getCurrentList().size()) {
            return null;
        }

        return getCurrentList().get(position);
    }

    @Override
    public int getItemViewType(int position) {
        MessageUiModel message = getItem(position);
        if (Objects.equals(message.getSenderId(), currentUserId)) {
            return VIEW_TYPE_SENT;
        }
        return VIEW_TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == VIEW_TYPE_SENT) {
            ItemChatMessageSentBinding binding = ItemChatMessageSentBinding.inflate(inflater, parent, false);
            return new SentMessageViewHolder(binding, listener);
        }

        ItemChatMessageReceivedBinding binding = ItemChatMessageReceivedBinding.inflate(inflater, parent, false);
        return new ReceivedMessageViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(getItem(position), shouldShowMessageTime(position));
    }

    private boolean shouldShowMessageTime(int position) {
        MessageUiModel current = getItem(position);
        if (current == null || current.getCreatedAt() == null) {
            return false;
        }

        int nextPosition = position + 1;
        if (nextPosition >= getItemCount()) {
            return true;
        }

        MessageUiModel next = getItem(nextPosition);
        if (next == null) {
            return true;
        }

        if (!Objects.equals(current.getSenderId(), next.getSenderId())) {
            return true;
        }

        return !TimeFormatter.isSameLocalDate(current.getCreatedAt(), next.getCreatedAt());
    }

    @NonNull
    private static String resolveDisplayContent(@NonNull MessageUiModel message) {
        String content = message.getContent();
        if (!TextUtils.isEmpty(content)) {
            return content;
        }

        List<AttachmentUiModel> attachments = message.getAttachments();
        if (attachments == null || attachments.isEmpty()) {
            return "";
        }

        AttachmentUiModel firstAttachment = attachments.get(0);
        if (firstAttachment == null) {
            return "";
        }

        if (firstAttachment.getType() == null) {
            return "[File]";
        }

        return switch (firstAttachment.getType()) {
            case IMAGE -> "[Image]";
            case AUDIO -> "[Voice]";
            case VIDEO -> "[Video]";
            case FILE -> {
                String fileName = firstAttachment.getFileName();
                yield TextUtils.isEmpty(fileName) ? "[File]" : "[File] " + fileName;
            }
        };
    }

    @NonNull
    public static List<AttachmentUiModel> getImageAttachments(@NonNull MessageUiModel message) {
        List<AttachmentUiModel> attachments = message.getAttachments();
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }

        List<AttachmentUiModel> imageAttachments = new ArrayList<>();
        for (AttachmentUiModel attachment : attachments) {
            if (attachment == null) {
                continue;
            }

            if (isImageAttachment(attachment)) {
                imageAttachments.add(attachment);
            }
        }

        return imageAttachments;
    }

    private static boolean isImageAttachment(@NonNull AttachmentUiModel attachment) {
        String url = safeTrim(attachment.getUrl());
        if (url == null) {
            return false;
        }

        if (attachment.getType() == AttachmentType.IMAGE) {
            return true;
        }

        String contentType = safeTrim(attachment.getContentType());
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return true;
        }

        String fileName = safeTrim(attachment.getFileName());
        if (fileName != null) {
            String lower = fileName.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".jpg")
                    || lower.endsWith(".jpeg")
                    || lower.endsWith(".png")
                    || lower.endsWith(".webp")
                    || lower.endsWith(".gif")
                    || lower.endsWith(".bmp")
                    || lower.endsWith(".heic")
                    || lower.endsWith(".heif")) {
                return true;
            }
        }

        String lowerUrl = url.toLowerCase(Locale.ROOT);
        return lowerUrl.contains("/image/upload/")
                || lowerUrl.endsWith(".jpg")
                || lowerUrl.endsWith(".jpeg")
                || lowerUrl.endsWith(".png")
                || lowerUrl.endsWith(".webp")
                || lowerUrl.endsWith(".gif");
    }

    @NonNull
    private static String resolveImageDisplayUrl(@NonNull String url) {
        String trimmed = url.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }

        // Force browser-friendly delivery format for Cloudinary assets.
        if (trimmed.contains("res.cloudinary.com") && trimmed.contains("/upload/")) {
            return trimmed.replace("/upload/", "/upload/f_auto,q_auto/");
        }

        return trimmed;
    }

    @Nullable
    private static String safeTrim(@Nullable String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public abstract static class ViewHolder extends RecyclerView.ViewHolder {
        protected final OnMessageClickListener listener;

        protected ViewHolder(@NonNull View itemView, OnMessageClickListener listener) {
            super(itemView);
            this.listener = listener;
        }

        public abstract void bind(MessageUiModel message, boolean showTime);
    }

    public static class SentMessageViewHolder extends ViewHolder {
        private final ItemChatMessageSentBinding binding;

        public SentMessageViewHolder(@NonNull ItemChatMessageSentBinding binding, OnMessageClickListener listener) {
            super(binding.getRoot(), listener);
            this.binding = binding;
        }

        @Override
        public void bind(MessageUiModel message, boolean showTime) {
            List<AttachmentUiModel> imageAttachments = getImageAttachments(message);
            if (!imageAttachments.isEmpty()) {
                AttachmentUiModel firstImageAttachment = imageAttachments.get(0);
                binding.layoutAttachmentSent.setVisibility(View.VISIBLE);
                Glide.with(binding.imgAttachmentSent)
                        .load(resolveImageDisplayUrl(firstImageAttachment.getUrl()))
                        .placeholder(R.drawable.default_avatar)
                        .error(R.drawable.default_avatar)
                        .into(binding.imgAttachmentSent);

                int imageCount = imageAttachments.size();
                if (imageCount > 1) {
                    binding.txtAttachmentCountSent.setText(itemView.getContext()
                            .getString(R.string.chat_detail_image_count_format, imageCount));
                    binding.txtAttachmentCountSent.setVisibility(View.VISIBLE);
                } else {
                    binding.txtAttachmentCountSent.setVisibility(View.GONE);
                }

                binding.layoutAttachmentSent.setOnClickListener(v -> {
                    if (listener != null) {
                        listener.onMessageClick(message);
                    }
                });
            } else {
                binding.layoutAttachmentSent.setVisibility(View.GONE);
                binding.txtAttachmentCountSent.setVisibility(View.GONE);
                binding.layoutAttachmentSent.setOnClickListener(null);
            }

            String messageText = message.getContent();
            String displayContent = !TextUtils.isEmpty(messageText)
                    ? messageText
                    : (imageAttachments.isEmpty() ? resolveDisplayContent(message) : "");

            if (!displayContent.isEmpty()) {
                binding.txtMessageSent.setText(displayContent);
                binding.txtMessageSent.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageSent.setVisibility(View.GONE);
            }

            if (showTime && message.getCreatedAt() != null) {
                binding.txtTimeSent.setText(TimeFormatter.formatTimestamp(message.getCreatedAt()));
                binding.txtTimeSent.setVisibility(View.VISIBLE);
            } else {
                binding.txtTimeSent.setVisibility(View.GONE);
            }

            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMessageClick(message);
                }
            });

            binding.getRoot().setOnLongClickListener(v -> {
                if (listener != null) {
                    listener.onMessageLongClick(message);
                }
                return true;
            });
        }
    }

    public static class ReceivedMessageViewHolder extends ViewHolder {
        private final ItemChatMessageReceivedBinding binding;

        public ReceivedMessageViewHolder(@NonNull ItemChatMessageReceivedBinding binding, OnMessageClickListener listener) {
            super(binding.getRoot(), listener);
            this.binding = binding;
        }

        @Override
        public void bind(MessageUiModel message, boolean showTime) {
            List<AttachmentUiModel> imageAttachments = getImageAttachments(message);
            if (!imageAttachments.isEmpty()) {
                AttachmentUiModel firstImageAttachment = imageAttachments.get(0);
                binding.layoutAttachmentReceived.setVisibility(View.VISIBLE);
                Glide.with(binding.imgAttachmentReceived)
                        .load(resolveImageDisplayUrl(firstImageAttachment.getUrl()))
                        .placeholder(R.drawable.default_avatar)
                        .error(R.drawable.default_avatar)
                        .into(binding.imgAttachmentReceived);

                int imageCount = imageAttachments.size();
                if (imageCount > 1) {
                    binding.txtAttachmentCountReceived.setText(itemView.getContext()
                            .getString(R.string.chat_detail_image_count_format, imageCount));
                    binding.txtAttachmentCountReceived.setVisibility(View.VISIBLE);
                } else {
                    binding.txtAttachmentCountReceived.setVisibility(View.GONE);
                }

                binding.layoutAttachmentReceived.setOnClickListener(v -> {
                    if (listener != null) {
                        listener.onMessageClick(message);
                    }
                });
            } else {
                binding.layoutAttachmentReceived.setVisibility(View.GONE);
                binding.txtAttachmentCountReceived.setVisibility(View.GONE);
                binding.layoutAttachmentReceived.setOnClickListener(null);
            }

            String messageText = message.getContent();
            String displayContent = !TextUtils.isEmpty(messageText)
                    ? messageText
                    : (imageAttachments.isEmpty() ? resolveDisplayContent(message) : "");

            if (!displayContent.isEmpty()) {
                binding.txtMessageReceived.setText(displayContent);
                binding.txtMessageReceived.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageReceived.setVisibility(View.GONE);
            }

            if (showTime && message.getCreatedAt() != null) {
                binding.txtTimeReceived.setText(TimeFormatter.formatTimestamp(message.getCreatedAt()));
                binding.txtTimeReceived.setVisibility(View.VISIBLE);
            } else {
                binding.txtTimeReceived.setVisibility(View.GONE);
            }

            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMessageClick(message);
                }
            });

            binding.getRoot().setOnLongClickListener(v -> {
                if (listener != null) {
                    listener.onMessageLongClick(message);
                }
                return true;
            });
        }
    }
}
