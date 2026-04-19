package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;
import com.dangngulon.frontend.databinding.ItemChatMessageReceivedBinding;
import com.dangngulon.frontend.databinding.ItemChatMessageSentBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.AttachmentUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;

import java.util.ArrayList;
import java.util.List;
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

        void onAttachmentClick(AttachmentUiModel attachment);
    }

    public void setOnMessageClickListener(OnMessageClickListener listener) {
        this.listener = listener;
    }

    public void setCurrentUserId(String currentUserId) {
        this.currentUserId = currentUserId;
    }

    public void submitMessages(List<MessageUiModel> messages) {
        submitList(messages);
    }

    public void add(MessageUiModel message) {
        if (message == null) {
            return;
        }

        List<MessageUiModel> newList = new ArrayList<>(getCurrentList());
        newList.add(message);
        submitList(newList);
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
        holder.bind(getItem(position));
    }

    public abstract static class ViewHolder extends RecyclerView.ViewHolder {
        protected final OnMessageClickListener listener;

        protected ViewHolder(@NonNull View itemView, OnMessageClickListener listener) {
            super(itemView);
            this.listener = listener;
        }

        public abstract void bind(MessageUiModel message);
    }

    public static class SentMessageViewHolder extends ViewHolder {
        private final ItemChatMessageSentBinding binding;

        public SentMessageViewHolder(@NonNull ItemChatMessageSentBinding binding, OnMessageClickListener listener) {
            super(binding.getRoot(), listener);
            this.binding = binding;
        }

        @Override
        public void bind(MessageUiModel message) {
            if (message.getContent() != null && !message.getContent().isEmpty()) {
                binding.txtMessageSent.setText(message.getContent());
                binding.txtMessageSent.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageSent.setVisibility(View.GONE);
            }

            if (message.getCreatedAt() != null) {
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
        public void bind(MessageUiModel message) {
            if (message.getContent() != null && !message.getContent().isEmpty()) {
                binding.txtMessageReceived.setText(message.getContent());
                binding.txtMessageReceived.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageReceived.setVisibility(View.GONE);
            }

            if (message.getCreatedAt() != null) {
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
