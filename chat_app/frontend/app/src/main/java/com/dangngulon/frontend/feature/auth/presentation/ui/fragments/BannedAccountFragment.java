package com.dangngulon.frontend.feature.auth.presentation.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentBannedAccountBinding;

public class BannedAccountFragment extends Fragment {

    public static final String ARG_MESSAGE = "banned_message";

    private FragmentBannedAccountBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentBannedAccountBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        String message = getArguments() == null ? null : getArguments().getString(ARG_MESSAGE);
        if (message != null && !message.trim().isEmpty()) {
            binding.tvBannedMessage.setText(message.trim());
        }

        binding.btnBackToLogin.setOnClickListener(v ->
                NavHostFragment.findNavController(this).popBackStack(R.id.loginFragment, false)
        );
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
