package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;
import com.dangngulon.frontend.core.utils.enums.ButtonType;
import com.dangngulon.frontend.databinding.ItemFriendRequestBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendRequestUiModel;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class FriendRequestAdapter extends ListAdapter<FriendRequestUiModel, FriendRequestAdapter.ViewHolder> {
    private static final String PAYLOAD_MODE = "PAYLOAD_MODE";

    private OnActionClickListener listener;
    private int lastPosition = -1;
    private ButtonType tabMode = ButtonType.RECEIVED;
    private final Map<String, ButtonType> itemModes = new HashMap<>();

    public FriendRequestAdapter() {
        super(new DiffUtil.ItemCallback<FriendRequestUiModel>() {
            @Override
            public boolean areItemsTheSame(@NonNull FriendRequestUiModel oldItem, @NonNull FriendRequestUiModel newItem) {
                return Objects.equals(oldItem.getUserId(), newItem.getUserId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull FriendRequestUiModel oldItem, @NonNull FriendRequestUiModel newItem) {
                return Objects.equals(oldItem.getDisplayName(), newItem.getDisplayName()) &&
                        Objects.equals(oldItem.getAvatarUrl(), newItem.getAvatarUrl());
            }
        });
    }

    public interface OnActionClickListener {
        void onReject(@NonNull FriendRequestUiModel request);

        void onAccept(@NonNull FriendRequestUiModel request);

        void onSentAction(@NonNull FriendRequestUiModel request);
    }

    public void setOnActionClickListener(OnActionClickListener listener) {
        this.listener = listener;
    }

    public void submitRequests(List<FriendRequestUiModel> requests) {
        submitList(requests);
    }

    public void setSendMode(ButtonType mode) {
        if (this.tabMode != mode) {
            this.tabMode = mode;
            notifyItemRangeChanged(0, getItemCount(), PAYLOAD_MODE);
        }
    }

    @NonNull
    public ButtonType getItemMode(@Nullable String userId) {
        if (userId == null) {
            return tabMode;
        }

        ButtonType mode = itemModes.get(userId);
        return mode != null ? mode : tabMode;
    }

    public void updateItemMode(@Nullable String userId, @NonNull ButtonType mode) {
        if (userId == null) {
            return;
        }

        itemModes.put(userId, mode);
        int position = findPositionByUserId(userId);
        if (position != RecyclerView.NO_POSITION) {
            notifyItemChanged(position, PAYLOAD_MODE);
        }
    }

    private int findPositionByUserId(@NonNull String userId) {
        List<FriendRequestUiModel> currentList = getCurrentList();
        for (int i = 0; i < currentList.size(); i++) {
            if (Objects.equals(currentList.get(i).getUserId(), userId)) {
                return i;
            }
        }
        return RecyclerView.NO_POSITION;
    }

    @NonNull
    private ButtonType resolveMode(@NonNull FriendRequestUiModel request) {
        return getItemMode(request.getUserId());
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemFriendRequestBinding binding = ItemFriendRequestBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false
        );
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        FriendRequestUiModel request = getItem(position);
        holder.bind(request, resolveMode(request));
        setAnimation(holder.itemView, position);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position, @NonNull List<Object> payloads) {
        if (!payloads.isEmpty() && payloads.contains(PAYLOAD_MODE)) {
            holder.updateMode(resolveMode(getItem(position)));
        } else {
            onBindViewHolder(holder, position);
        }
    }

    @Override
    public void onViewDetachedFromWindow(@NonNull ViewHolder holder) {
        super.onViewDetachedFromWindow(holder);
        holder.itemView.clearAnimation();
    }

    private void setAnimation(View view, int position) {
        if (position > lastPosition) {
            Animation animation = AnimationUtils.loadAnimation(view.getContext(), R.anim.item_animation_from_bottom);
            view.startAnimation(animation);
            lastPosition = position;
        }
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemFriendRequestBinding binding;
        private final OnActionClickListener listener;

        ViewHolder(@NonNull ItemFriendRequestBinding binding, OnActionClickListener listener) {
            super(binding.getRoot());
            this.binding = binding;
            this.listener = listener;
        }

        void bind(FriendRequestUiModel request, ButtonType mode) {
            binding.requestName.setText(request.getDisplayName());
            binding.requestMeta.setText(TimeFormatter.formatDate(request.getCreatedAt()));

            Glide.with(binding.requestAvatar.getContext())
                    .load(request.getAvatarUrl())
                    .placeholder(R.drawable.default_avatar)
                    .error(R.drawable.default_avatar)
                    .into(binding.requestAvatar);

            binding.btnReject.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onReject(request);
                }
            });

            binding.btnAccept.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onAccept(request);
                }
            });

            binding.btnSentAction.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onSentAction(request);
                }
            });

            updateMode(mode);
        }

        void updateMode(ButtonType type) {
            if (type == ButtonType.SENT) {
                binding.incomingActions.setVisibility(View.GONE);
                binding.btnSentAction.setVisibility(View.VISIBLE);
                binding.btnSentAction.setText(R.string.friend_request_action_cancel);
            } else if (type == ButtonType.RECEIVED) {
                binding.incomingActions.setVisibility(View.VISIBLE);
                binding.btnSentAction.setVisibility(View.GONE);
            } else if (type == ButtonType.REJECT) {
                binding.incomingActions.setVisibility(View.GONE);
                binding.btnSentAction.setVisibility(View.VISIBLE);
                binding.btnSentAction.setText(R.string.friend_request_action_resend);
            } else if (type == ButtonType.SEND) {
                binding.incomingActions.setVisibility(View.GONE);
                binding.btnSentAction.setVisibility(View.VISIBLE);
                binding.btnSentAction.setText(R.string.friend_request_action_send);
            } else if (type == ButtonType.ACCEPT) {
                binding.incomingActions.setVisibility(View.GONE);
                binding.btnSentAction.setVisibility(View.GONE);
            }
        }
    }
}
