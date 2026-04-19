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

import com.bumptech.glide.Glide;
import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.ItemSelectableContactBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.SelectableContactItem;
import com.dangngulon.frontend.core.common.ui.helpers.TimeFormatter;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class SelectableContactAdapter extends ListAdapter<SelectableContactItem, SelectableContactAdapter.ViewHolder> {
    private OnContactSelectionListener listener;
    private Set<String> selectedContactIds;
    private int lastPosition = -1;

    public SelectableContactAdapter(OnContactSelectionListener listener) {
        super(new DiffUtil.ItemCallback<SelectableContactItem>() {
            @Override
            public boolean areItemsTheSame(@NonNull SelectableContactItem oldItem, @NonNull SelectableContactItem newItem) {
                return Objects.equals(oldItem.getUserId(), newItem.getUserId());
            }

            @Override
            public boolean areContentsTheSame(
                    @NonNull SelectableContactItem oldItem,
                    @NonNull SelectableContactItem newItem
            ) {
                return Objects.equals(oldItem.getUsername(), newItem.getUsername()) &&
                        Objects.equals(oldItem.getAvatar(), newItem.getAvatar()) &&
                        Objects.equals(oldItem.getLastChatTime(), newItem.getLastChatTime());
            }
        });
        this.selectedContactIds = new HashSet<>();
        this.listener = listener;
    }

    public void submitContacts(List<SelectableContactItem> contacts) {
        submitList(contacts);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemSelectableContactBinding binding = ItemSelectableContactBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SelectableContactItem contact = getItem(position);
        holder.bind(contact, selectedContactIds.contains(contact.getUserId()));
        setAnimation(holder.itemView, position);
    }

    @Override
    public void onViewDetachedFromWindow(@NonNull ViewHolder holder) {
        super.onViewDetachedFromWindow(holder);
        holder.itemView.clearAnimation();
    }

    public void removeSelection(String contactId) {
        selectedContactIds.remove(contactId);
        
        // Find and update only the changed item
        for (int i = 0; i < getCurrentList().size(); i++) {
            if (getCurrentList().get(i).getUserId().equals(contactId)) {
                notifyItemChanged(i);
                break;
            }
        }
    }

    public int getSelectedCount() {
        return selectedContactIds.size();
    }

    private void setAnimation(View viewToAnimate, int position) {
        if (position > lastPosition) {
            Animation animation = AnimationUtils.loadAnimation(viewToAnimate.getContext(), R.anim.item_animation_from_bottom);
            animation.setStartOffset(position * 50L);
            viewToAnimate.startAnimation(animation);
            lastPosition = position;
        }
    }




    public static class ViewHolder extends RecyclerView.ViewHolder {
        OnContactSelectionListener listener;
        private final ItemSelectableContactBinding binding;

        ViewHolder(
                @NonNull ItemSelectableContactBinding binding,
                OnContactSelectionListener listener
        ) {
            super(binding.getRoot());
            this.binding = binding;
            this.listener = listener;
        }

        @SuppressLint("SetTextI18n")
        void bind(SelectableContactItem contact, boolean isSelected) {
            binding.tvName.setText(contact.getUsername());

            String time = TimeFormatter.formatLastChatTime(contact.getLastChatTime());
            binding.tvLastActive.setText(time);

            Glide.with(binding.ivAvatar.getContext())
                    .load(contact.getAvatar())
                    .into(binding.ivAvatar);

            if (isSelected) {
                binding.viewUnchecked.setVisibility(View.GONE);
                binding.ivChecked.setVisibility(View.VISIBLE);
                binding.ivChecked.setScaleX(0f);
                binding.ivChecked.setScaleY(0f);
                binding.ivChecked.animate().scaleX(1f).scaleY(1f).setDuration(150).start();
            } else {
                binding.viewUnchecked.setVisibility(View.VISIBLE);
                binding.ivChecked.setVisibility(View.GONE);
            }

            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onContactSelected(contact, !isSelected);
                }
            });
        }
    }


    public interface OnContactSelectionListener {
        void onContactSelected(SelectableContactItem contact, boolean isSelected);
    }
}
