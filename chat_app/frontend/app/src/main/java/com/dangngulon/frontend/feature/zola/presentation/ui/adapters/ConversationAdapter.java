package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.helpers.AvatarImageLoader;
import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;
import com.dangngulon.frontend.core.utils.enums.ConversationType;
import com.dangngulon.frontend.databinding.ItemConversationBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;

import java.util.List;
import java.util.Objects;

public class ConversationAdapter extends ListAdapter<ConversationUiModel, ConversationAdapter.ViewHolder> {
    private OnConversationClickListener listener;
    private String currentUserId;
    private int lastPosition = -1;

    public ConversationAdapter() {
        super(new DiffUtil.ItemCallback<ConversationUiModel>() {
            @Override
            public boolean areItemsTheSame(@NonNull ConversationUiModel oldItem, @NonNull ConversationUiModel newItem) {
                return Objects.equals(oldItem.getConversationId(), newItem.getConversationId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull ConversationUiModel oldItem, @NonNull ConversationUiModel newItem) {
                return Objects.equals(oldItem.getName(), newItem.getName()) &&
                        Objects.equals(oldItem.getAvatarUrl(), newItem.getAvatarUrl()) &&
                        Objects.equals(oldItem.getLastSenderId(), newItem.getLastSenderId()) &&
                        Objects.equals(oldItem.getLastMessagePreview(), newItem.getLastMessagePreview()) &&
                        Objects.equals(oldItem.getLastSenderName(), newItem.getLastSenderName()) &&
                        Objects.equals(oldItem.getLastMessageAt(), newItem.getLastMessageAt()) &&
                        oldItem.getUnreadCount() == newItem.getUnreadCount() &&
                        oldItem.isHasUnread() == newItem.isHasUnread() &&
                        oldItem.getMemberCount() == newItem.getMemberCount();
            }
        });
    }

    public interface OnConversationClickListener {
        void onConversationClick(ConversationUiModel conversation);

        void onConversationLongClick(ConversationUiModel conversation);
    }

    public void setOnConversationClickListener(OnConversationClickListener listener) {
        this.listener = listener;
    }

    public void setCurrentUserId(String currentUserId) {
        this.currentUserId = currentUserId == null ? null : currentUserId.trim();
        notifyDataSetChanged();
    }

    public void submitConversations(List<ConversationUiModel> conversations) {
        submitList(conversations);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemConversationBinding binding = ItemConversationBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false
        );
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ConversationUiModel conversation = getItem(position);
        holder.bind(conversation, currentUserId);
        setAnimation(holder.itemView, position);
    }

    @Override
    public void onViewDetachedFromWindow(@NonNull ViewHolder holder) {
        super.onViewDetachedFromWindow(holder);
        holder.itemView.clearAnimation();
    }

    @Override
    public int getItemCount() {
        return getCurrentList().size();
    }

    private void setAnimation(View view, int position) {
        if (position > lastPosition) {
            Animation animation = AnimationUtils.loadAnimation(view.getContext(), R.anim.item_animation_from_bottom);
            view.startAnimation(animation);
            lastPosition = position;
        }
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemConversationBinding binding;
        private final OnConversationClickListener listener;

        ViewHolder(@NonNull ItemConversationBinding binding, OnConversationClickListener listener) {
            super(binding.getRoot());
            this.binding = binding;
            this.listener = listener;
        }

        @SuppressLint("SetTextI18n")
        void bind(ConversationUiModel conversation, String currentUserId) {
            binding.conversationName.setText(conversation.getName());
            binding.timestamp.setText(TimeFormatter.formatConversationTimestamp(conversation.getLastMessageAt()));

            AvatarImageLoader.load(binding.avatar, conversation.getAvatarUrl());

            String preview = conversation.getLastMessagePreview() == null ? "" : conversation.getLastMessagePreview();
            String senderId = conversation.getLastSenderId();
            boolean isSentByCurrentUser = hasText(currentUserId) && hasText(senderId) && currentUserId.equals(senderId);
            String previewText = preview.isEmpty() ? "" : (isSentByCurrentUser ? "B\u1ea1n: " + preview : preview);

            if (conversation.getType() == ConversationType.PRIVATE) {
                binding.lastMessage.setText(previewText);
                binding.memberCount.setVisibility(View.GONE);
                binding.onlineIndicator.setVisibility(View.VISIBLE);
            } else {
                binding.lastMessage.setText(previewText);
                binding.memberCount.setText(String.valueOf(conversation.getMemberCount()));
                binding.memberCount.setVisibility(View.VISIBLE);
                binding.onlineIndicator.setVisibility(View.GONE);
            }

            if (conversation.getUnreadCount() > 0) {
                binding.unreadBadge.setText(String.valueOf(conversation.getUnreadCount()));
                binding.unreadBadge.setVisibility(View.VISIBLE);
            } else {
                binding.unreadBadge.setVisibility(View.GONE);
            }

            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onConversationClick(conversation);
                }
            });

            binding.getRoot().setOnLongClickListener(v -> {
                if (listener != null) {
                    listener.onConversationLongClick(conversation);
                }
                return true;
            });
        }

        private boolean hasText(String value) {
            return value != null && !value.trim().isEmpty();
        }
    }
}
