package com.dangngulon.frontend.feature.auth.presentation.ui;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.dangngulon.frontend.databinding.ActivityAuthBinding;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.feature.auth.presentation.sharedstate.AuthSharedViewModel;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class AuthActivity extends AppCompatActivity {
    private AuthSharedViewModel authSharedViewModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        UiHelper.hideActionBar(this);

        ActivityAuthBinding binding = ActivityAuthBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        initViewModel();
    }

    private void initViewModel() {
        authSharedViewModel = new ViewModelProvider(this)
                .get(AuthSharedViewModel.class);
    }
}

