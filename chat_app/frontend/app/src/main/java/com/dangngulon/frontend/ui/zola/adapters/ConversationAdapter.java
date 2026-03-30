package com.dangngulon.frontend.ui.zola.adapters;

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

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.ItemConversationBinding;
import com.dangngulon.frontend.model.zola.response.ConversationResponse;
import com.dangngulon.frontend.utils.enums.ConversationType;

import java.util.List;
import java.util.Objects;

public class ConversationAdapter extends ListAdapter<ConversationResponse, ConversationAdapter.ViewHolder> {
    private OnConversationClickListener listener;
    private int lastPosition = -1;

    public ConversationAdapter() {
        super(new DiffUtil.ItemCallback<ConversationResponse>() {
            @Override
            public boolean areItemsTheSame(@NonNull ConversationResponse oldItem, @NonNull ConversationResponse newItem) {
                return oldItem.getConversationId().equals(newItem.getConversationId());
            }

            @Override
            public boolean areContentsTheSame(
                    @NonNull ConversationResponse oldItem,
                    @NonNull ConversationResponse newItem
            ) {
                return Objects.equals(oldItem.getName(), newItem.getName()) &&
                        Objects.equals(oldItem.getAvatarUrl(), newItem.getAvatarUrl()) &&
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
        void onConversationClick(ConversationResponse conversation);
        void onConversationLongClick(ConversationResponse conversation);
    }

    public void setOnConversationClickListener(OnConversationClickListener listener) {
        this.listener = listener;
    }

    public void submitConversations(List<ConversationResponse> conversations) {
        submitList(conversations);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemConversationBinding binding = ItemConversationBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ConversationResponse conversation = getItem(position);
        holder.bind(conversation);
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
        OnConversationClickListener listener;
        private final ItemConversationBinding binding;

        ViewHolder(
                @NonNull ItemConversationBinding binding,
                OnConversationClickListener listener
        ) {
            super(binding.getRoot());
            this.binding = binding;
            this.listener = listener ;
        }

        @SuppressLint("SetTextI18n")
        void bind(ConversationResponse conversation) {
            binding.conversationName.setText(conversation.getName());
            binding.timestamp.setText(conversation.getLastMessageAt());

            Glide.with(binding.avatar.getContext())
                    .load(conversation.getAvatarUrl())
                    .into(binding.avatar);

            if (conversation.getType() == ConversationType.PRIVATE) {
                if (!conversation.getLastMessagePreview().isEmpty()) {
                    binding.lastMessage.setText(
                        conversation.getLastMessagePreview()
                    );
                }
                binding.memberCount.setVisibility(View.GONE);
                binding.onlineIndicator.setVisibility(View.VISIBLE);
            } else {
                if (!conversation.getLastMessagePreview().isEmpty()) {
                    binding.lastMessage.setText(
                            conversation.getLastSenderName() +
                            ": " +
                            conversation.getLastMessagePreview()
                    );
                }
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

            // TODO : tag
//            if (conversation.getTag() != null && !conversation.getTag().isEmpty()) {
//                binding.tagText.setText(conversation.getTag());
//                binding.tagsContainer.setVisibility(View.VISIBLE);
//            } else {
//                binding.tagsContainer.setVisibility(View.GONE);
//            }

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
    }
}
