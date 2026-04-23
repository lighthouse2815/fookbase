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
import com.dangngulon.frontend.databinding.ItemContactBinding;
import com.dangngulon.frontend.feature.zola.presentation.model.ContactUiModel;

import java.util.Objects;

public class ContactAdapter extends ListAdapter<ContactUiModel, ContactAdapter.ViewHolder> {
    private OnContactClickListener listener;
    private int lastPosition = -1;

    public ContactAdapter() {
        super(new DiffUtil.ItemCallback<ContactUiModel>() {
            @Override
            public boolean areItemsTheSame(@NonNull ContactUiModel oldItem, @NonNull ContactUiModel newItem) {
                return Objects.equals(oldItem.getContactId(), newItem.getContactId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull ContactUiModel oldItem, @NonNull ContactUiModel newItem) {
                return Objects.equals(oldItem.getNickName(), newItem.getNickName()) &&
                        Objects.equals(oldItem.getPhoneNumber(), newItem.getPhoneNumber()) &&
                        Objects.equals(oldItem.getAvatarUrl(), newItem.getAvatarUrl());
            }
        });
    }

    public interface OnContactClickListener {
        void onContactClick(ContactUiModel contact);
    }

    public void setOnContactClickListener(OnContactClickListener listener) {
        this.listener = listener;
    }

    public void submitContactsList(java.util.List<ContactUiModel> contacts) {
        submitList(contacts);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemContactBinding binding = ItemContactBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false
        );
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ContactUiModel contact = getItem(position);
        holder.bind(contact);
        setAnimation(holder.itemView, position);
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
        private final ItemContactBinding binding;
        private final OnContactClickListener listener;

        ViewHolder(@NonNull ItemContactBinding binding, OnContactClickListener listener) {
            super(binding.getRoot());
            this.binding = binding;
            this.listener = listener;
        }

        void bind(ContactUiModel contact) {
            binding.contactName.setText(contact.getNickName());
            binding.onlineIndicator.setVisibility(View.VISIBLE);
            binding.contactStatus.setVisibility(View.VISIBLE);

            AvatarImageLoader.load(binding.avatar, contact.getAvatarUrl());

            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onContactClick(contact);
                }
            });
        }
    }
}
