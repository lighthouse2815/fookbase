package com.dangngulon.frontend.feature.zola.presentation.ui.adapters;

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
import com.dangngulon.frontend.databinding.ItemSelectedMemberBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.SelectableContactItem;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class SelectedMemberAdapter extends ListAdapter<SelectableContactItem, SelectedMemberAdapter.ViewHolder> {
    private OnMemberRemoveListener listener;
    private int lastPosition = -1;

    public SelectedMemberAdapter(OnMemberRemoveListener listener) {
        super(new DiffUtil.ItemCallback<SelectableContactItem>() {
            @Override
            public boolean areItemsTheSame(@NonNull SelectableContactItem oldItem, @NonNull SelectableContactItem newItem) {
                return Objects.equals(oldItem.getUserId(), newItem.getUserId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull SelectableContactItem oldItem, @NonNull SelectableContactItem newItem) {
                return Objects.equals(oldItem.getUsername(), newItem.getUsername()) &&
                        Objects.equals(oldItem.getPhoneNumber(), newItem.getPhoneNumber());
            }
        });
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemSelectedMemberBinding binding = ItemSelectedMemberBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SelectableContactItem contact = getItem(position);
        holder.bind(contact);
        setAnimation(holder.itemView, position);
    }

    @Override
    public void onViewDetachedFromWindow(@NonNull ViewHolder holder) {
        super.onViewDetachedFromWindow(holder);
        holder.itemView.clearAnimation();
    }

    public void addMember(SelectableContactItem contact) {
        List<SelectableContactItem> currentList = new ArrayList<>(getCurrentList());
        if (!containsMember(contact.getUserId())) {
            currentList.add(contact);
            submitList(currentList);
        }
    }

    public void removeMember(SelectableContactItem contact) {
        List<SelectableContactItem> currentList = new ArrayList<>(getCurrentList());
        for (int i = 0; i < currentList.size(); i++) {
            if (currentList.get(i).getUserId().equals(contact.getUserId())) {
                currentList.remove(i);
                submitList(currentList);
                break;
            }
        }
    }

    private boolean containsMember(String userId) {
        for (SelectableContactItem contact : getCurrentList()) {
            if (contact.getUserId().equals(userId)) {
                return true;
            }
        }
        return false;
    }

    public int getMemberCount() {
        return getCurrentList().size();
    }

    private void setAnimation(View viewToAnimate, int position) {
        if (position > lastPosition) {
            Animation animation = AnimationUtils.loadAnimation(viewToAnimate.getContext(), R.anim.scale_up);
            animation.setStartOffset(position * 50L);
            viewToAnimate.startAnimation(animation);
            lastPosition = position;
        }
    }



    public class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemSelectedMemberBinding binding;

        public ViewHolder(@NonNull ItemSelectedMemberBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(SelectableContactItem contact) {
            AvatarImageLoader.load(binding.ivAvatar, contact.getAvatar());

            binding.ivRemove.setOnClickListener(v -> {
                Animation animation = AnimationUtils.loadAnimation(v.getContext(), R.anim.fade_out);
                animation.setDuration(150);
                animation.setAnimationListener(new Animation.AnimationListener() {
                    @Override
                    public void onAnimationStart(Animation animation) {}

                    @Override
                    public void onAnimationEnd(Animation animation) {
                        if (listener != null) {
                            listener.onMemberRemoved(contact);
                        }
                    }

                    @Override
                    public void onAnimationRepeat(Animation animation) {}
                });
                itemView.startAnimation(animation);
            });
        }
    }


    public interface OnMemberRemoveListener {
        void onMemberRemoved(SelectableContactItem contact);
    }
}
