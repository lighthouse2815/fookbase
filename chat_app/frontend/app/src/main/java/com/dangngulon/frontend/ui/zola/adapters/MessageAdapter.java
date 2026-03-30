package com.dangngulon.frontend.ui.zola.adapters;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.dangngulon.frontend.databinding.ItemChatMessageReceivedBinding;
import com.dangngulon.frontend.databinding.ItemChatMessageSentBinding;
import com.dangngulon.frontend.model.zola.response.AttachmentResponse;
import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.ui.common.helpers.TimeFormatter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class MessageAdapter extends ListAdapter<MessageResponse, MessageAdapter.ViewHolder> {
    private static final int VIEW_TYPE_SENT = 1;
    private static final int VIEW_TYPE_RECEIVED = 2;

    private String currentUserId;
    private OnMessageClickListener listener;

    public MessageAdapter() {
        super(new DiffUtil.ItemCallback<MessageResponse>() {
            @Override
            public boolean areItemsTheSame(@NonNull MessageResponse oldItem, @NonNull MessageResponse newItem) {
                return oldItem.getMessageId().equals(newItem.getMessageId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull MessageResponse oldItem, @NonNull MessageResponse newItem) {
                return Objects.equals(oldItem.getContent(), newItem.getContent()) &&
                        Objects.equals(oldItem.getStatus(), newItem.getStatus()) &&
                        Objects.equals(oldItem.getCreatedAt(), newItem.getCreatedAt()) &&
                        Objects.equals(oldItem.getAttachments(), newItem.getAttachments());
            }
        });
    }

    public interface OnMessageClickListener {
        void onMessageClick(MessageResponse message);
        void onMessageLongClick(MessageResponse message);
        void onAttachmentClick(AttachmentResponse attachment);
    }

    public void setOnMessageClickListener(OnMessageClickListener listener) {
        this.listener = listener;
    }

    public void setCurrentUserId(String currentUserId) {
        this.currentUserId = currentUserId;
    }

    public void submitMessages(List<MessageResponse> messages) {
        submitList(messages);
    }

    public void add(MessageResponse message) {
        if (message == null) return;
        
        List<MessageResponse> currentList = getCurrentList();
        List<MessageResponse> newList = new ArrayList<>(currentList);
        newList.add(message);
        submitList(newList);
    }

    @Override
    public int getItemViewType(int position) {
        MessageResponse message = getItem(position);
        if (message.getSenderId().equals(currentUserId)) {
            return VIEW_TYPE_SENT;
        } else {
            return VIEW_TYPE_RECEIVED;
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        
        if (viewType == VIEW_TYPE_SENT) {
            ItemChatMessageSentBinding binding = ItemChatMessageSentBinding.inflate(inflater, parent, false);
            return new SentMessageViewHolder(binding, listener);
        } else {
            ItemChatMessageReceivedBinding binding = ItemChatMessageReceivedBinding.inflate(inflater, parent, false);
            return new ReceivedMessageViewHolder(binding, listener);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        MessageResponse message = getItem(position);
        holder.bind(message);
    }

    public abstract static class ViewHolder extends RecyclerView.ViewHolder {
        protected OnMessageClickListener listener;

        protected ViewHolder(@NonNull View itemView, OnMessageClickListener listener) {
            super(itemView);
            this.listener = listener;
        }

        public abstract void bind(MessageResponse message);
    }

    public static class SentMessageViewHolder extends ViewHolder {
        private final ItemChatMessageSentBinding binding;

        public SentMessageViewHolder(@NonNull ItemChatMessageSentBinding binding, OnMessageClickListener listener) {
            super(binding.getRoot(), listener);
            this.binding = binding;
        }

        @SuppressLint("SetTextI18n")
        @Override
        public void bind(MessageResponse message) {
            // Set message content
            if (message.getContent() != null && !message.getContent().isEmpty()) {
                binding.txtMessageSent.setText(message.getContent());
                binding.txtMessageSent.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageSent.setVisibility(View.GONE);
            }

            // Set timestamp
            if (message.getCreatedAt() != null) {
                binding.txtTimeSent.setText(TimeFormatter.formatTimestamp(message.getCreatedAt()));
                binding.txtTimeSent.setVisibility(View.VISIBLE);
            } else {
                binding.txtTimeSent.setVisibility(View.GONE);
            }

            // Set click listeners
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

        private String formatTimestamp(java.time.Instant timestamp) {
            // TODO: Implement proper timestamp formatting
            return timestamp.toString();
        }
    }

    public static class ReceivedMessageViewHolder extends ViewHolder {
        private final ItemChatMessageReceivedBinding binding;

        public ReceivedMessageViewHolder(@NonNull ItemChatMessageReceivedBinding binding, OnMessageClickListener listener) {
            super(binding.getRoot(), listener);
            this.binding = binding;
        }

        @SuppressLint("SetTextI18n")
        @Override
        public void bind(MessageResponse message) {
            // Set message content
            if (message.getContent() != null && !message.getContent().isEmpty()) {
                binding.txtMessageReceived.setText(message.getContent());
                binding.txtMessageReceived.setVisibility(View.VISIBLE);
            } else {
                binding.txtMessageReceived.setVisibility(View.GONE);
            }

            // Set timestamp
            if (message.getCreatedAt() != null) {
                binding.txtTimeReceived.setText(TimeFormatter.formatTimestamp(message.getCreatedAt()));
                binding.txtTimeReceived.setVisibility(View.VISIBLE);
            } else {
                binding.txtTimeReceived.setVisibility(View.GONE);
            }

            // Set click listeners
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
