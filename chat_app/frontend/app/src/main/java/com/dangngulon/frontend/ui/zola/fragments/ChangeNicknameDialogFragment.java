package com.dangngulon.frontend.ui.zola.fragments;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.DialogChangeNicknameBinding;

public class ChangeNicknameDialogFragment extends DialogFragment {
    private DialogChangeNicknameBinding binding;
    private String currentNickname;
    private String userName;

    public static final String REQUEST_KEY = "change_nickname_request";
    public static final String RESULT_KEY = "new_nickname";

    public ChangeNicknameDialogFragment() {
        // Required empty public constructor
    }

    public static ChangeNicknameDialogFragment newInstance(String userName, String currentNickname) {
        ChangeNicknameDialogFragment fragment = new ChangeNicknameDialogFragment();
        Bundle args = new Bundle();
        args.putString("userName", userName);
        args.putString("currentNickname", currentNickname);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            userName = getArguments().getString("userName", "");
            currentNickname = getArguments().getString("currentNickname", "");
        }
        setStyle(STYLE_NORMAL, R.style.DialogSlideAnimation);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = DialogChangeNicknameBinding.inflate(inflater, container, false);
        
        setupDialog();
        setupViews();
        setupListeners();
        
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        // Make dialog fullscreen
        if (getDialog() != null && getDialog().getWindow() != null) {
            Window window = getDialog().getWindow();
            window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void setupDialog() {
        if (getDialog() != null && getDialog().getWindow() != null) {
            getDialog().getWindow().requestFeature(Window.FEATURE_NO_TITLE);
        }
    }

    private void setupViews() {
        // Set current nickname or username as default
        String initialText = "";
        if (currentNickname != null && !currentNickname.isEmpty()) {
            initialText = currentNickname;
        } else if (userName != null && !userName.isEmpty()) {
            initialText = userName;
        }
        
        binding.etNickname.setText(initialText);
        binding.etNickname.setSelection(binding.etNickname.getText().length());
        
        // Update character count
        updateCharCount(binding.etNickname.getText().length());
        
        // Initially disable save button if text is empty
        binding.btnSave.setEnabled(!initialText.isEmpty());
        if (!initialText.isEmpty()) {
            binding.btnSave.setTextColor(Color.WHITE);
        } else {
            binding.btnSave.setTextColor(getResources().getColor(R.color.text_secondary));
        }
    }

    private void setupListeners() {
        // Text watcher for character count and save button state
        binding.etNickname.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateCharCount(s.length());
                binding.btnSave.setEnabled(s.length() > 0);
                
                // Update button text color based on enabled state
                if (s.length() > 0) {
                    binding.btnSave.setTextColor(Color.WHITE);
                } else {
                    binding.btnSave.setTextColor(getResources().getColor(R.color.text_secondary));
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Close button
        binding.btnClose.setOnClickListener(v -> dismiss());

        // Clear button
        binding.btnClear.setOnClickListener(v -> binding.etNickname.setText(""));

        // Save button
        binding.btnSave.setOnClickListener(v -> {
            String newNickname = binding.etNickname.getText().toString().trim();
            if (!newNickname.isEmpty()) {
                // Send result using FragmentResult API
                Bundle result = new Bundle();
                result.putString(RESULT_KEY, newNickname);
                getParentFragmentManager().setFragmentResult(REQUEST_KEY, result);
                
                Toast.makeText(getContext(), "Nickname updated", Toast.LENGTH_SHORT).show();
                dismiss();
            }
        });
    }

    private void updateCharCount(int length) {
        binding.tvCharCount.setText(getResources().getString(R.string.char_count_format, length));
    }
}
