package com.dangngulon.frontend.ui.zola.adapters;

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
import com.dangngulon.frontend.databinding.ItemContactBinding;
import com.dangngulon.frontend.model.zola.response.ContactResponse;

import java.util.Objects;

public class ContactAdapter extends ListAdapter<ContactResponse, ContactAdapter.ViewHolder> {
    private OnContactClickListener listener;
    private int lastPosition = -1;

    public ContactAdapter() {
        super(new DiffUtil.ItemCallback<ContactResponse>() {
            @Override
            public boolean areItemsTheSame(@NonNull ContactResponse oldItem, @NonNull ContactResponse newItem) {
                return oldItem.getContactId().equals(newItem.getContactId());
            }

            @Override
            public boolean areContentsTheSame(@NonNull ContactResponse oldItem, @NonNull ContactResponse newItem) {
                return Objects.equals(oldItem.getNickName(), newItem.getNickName()) &&
                        Objects.equals(oldItem.getPhoneNumber(), newItem.getPhoneNumber());
            }
        });
    }

    public interface OnContactClickListener {
        void onContactClick(ContactResponse contact);
    }

    public void setOnContactClickListener(OnContactClickListener listener) {
        this.listener = listener;
    }

    public void submitContacts(ContactResponse... contacts) {
        submitList(java.util.Arrays.asList(contacts));
    }

    public void submitContactsList(java.util.List<ContactResponse> contacts) {
        submitList(contacts);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemContactBinding binding = ItemContactBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ContactResponse contact = getItem(position);
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

        void bind(ContactResponse contact) {
            binding.contactName.setText(contact.getNickName());
            binding.onlineIndicator.setVisibility(View.VISIBLE);
            binding.contactStatus.setVisibility(View.VISIBLE);

            Glide.with(binding.avatar.getContext())
                    .load(contact.getAvatarUrl())
                    .into(binding.avatar);

            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onContactClick(contact);
                }
            });
        }
    }
}
