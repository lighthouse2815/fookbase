package com.dangngulon.frontend.feature.auth.presentation.ui.fragments;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.core.common.ui.helpers.UiHelper;
import com.dangngulon.frontend.core.common.viewmodel.state.Result;
import com.dangngulon.frontend.databinding.FragmentCompleteProfileBinding;
import com.dangngulon.frontend.feature.auth.presentation.viewmodel.CompleteProfileViewModel;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Pattern;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class CompleteProfileFragment extends Fragment {

    public static final String ARG_MODE = "profile_mode";
    public static final String MODE_LOCAL = "local";
    public static final String MODE_GOOGLE = "google";
    public static final String ARG_FIRST_NAME = "first_name";
    public static final String ARG_LAST_NAME = "last_name";
    public static final String ARG_EMAIL = "email";
    public static final String ARG_PHONE_NUMBER = "phone_number";
    public static final String ARG_DISPLAY_NAME = "display_name";
    public static final String ARG_AVATAR_URL = "avatar_url";
    public static final String ARG_BIRTHDAY = "birthday";
    public static final String ARG_GENDER = "gender";

    private static final String CHAT_APP_ACTIVITY_CLASS =
            "com.dangngulon.frontend.feature.zola.presentation.ui.ChatAppActivity";
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");

    private FragmentCompleteProfileBinding binding;
    private CompleteProfileViewModel completeProfileViewModel;

    private boolean isGoogleMode;
    private String avatarUrl;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentCompleteProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        UiHelper.setupBottomNavigation(
                this,
                binding.mainScrollView,
                R.color.background_dark
        );

        initViewModel();
        initModeAndPrefill();
        initGenderDropdown();
        initEvents();
        observeViewModel();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel() {
        completeProfileViewModel = new ViewModelProvider(this).get(CompleteProfileViewModel.class);
    }

    private void initModeAndPrefill() {
        Bundle args = getArguments();
        String mode = args == null ? MODE_LOCAL : args.getString(ARG_MODE, MODE_LOCAL);
        isGoogleMode = MODE_GOOGLE.equalsIgnoreCase(mode);

        binding.layoutGoogleFields.setVisibility(isGoogleMode ? View.VISIBLE : View.GONE);
        binding.tvSubtitle.setText(isGoogleMode
                ? R.string.complete_profile_subtitle_google
                : R.string.complete_profile_subtitle_local);

        if (args == null) {
            return;
        }

        binding.etDisplayName.setText(args.getString(ARG_DISPLAY_NAME, ""));
        binding.etLastName.setText(args.getString(ARG_LAST_NAME, ""));
        binding.etFirstName.setText(args.getString(ARG_FIRST_NAME, ""));
        binding.etPhone.setText(args.getString(ARG_PHONE_NUMBER, ""));
        binding.etEmail.setText(args.getString(ARG_EMAIL, ""));
        binding.etBirthday.setText(args.getString(ARG_BIRTHDAY, ""));
        binding.etGender.setText(formatGenderForDisplay(args.getString(ARG_GENDER, "")), false);
        avatarUrl = normalize(args.getString(ARG_AVATAR_URL, null));
    }

    private void initGenderDropdown() {
        String[] genderItems = new String[]{
                getString(R.string.gender_male),
                getString(R.string.gender_female),
                getString(R.string.gender_other)
        };

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                requireContext(),
                android.R.layout.simple_dropdown_item_1line,
                genderItems
        );

        binding.etGender.setAdapter(adapter);
    }

    private void initEvents() {
        binding.etBirthday.setOnClickListener(v -> showDatePicker());
        binding.tilBirthday.setEndIconOnClickListener(v -> showDatePicker());

        binding.btnCompleteProfile.setOnClickListener(v -> handleCompleteProfile());
    }

    private void observeViewModel() {
        completeProfileViewModel.getCompleteProfileResult()
                .observe(getViewLifecycleOwner(), event -> {
                    if (event == null) return;

                    Result<Void> result = event.getContentIfNotHandled();
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            showLoading(true);
                            break;

                        case SUCCESS:
                            showLoading(false);
                            navigateToChatApp();
                            break;

                        case ERROR:
                            showLoading(false);
                            UiHelper.showToast(requireContext(), result.getMessage());
                            break;
                    }
                });
    }

    private void showDatePicker() {
        LocalDate initialDate = parseBirthdayOrToday(UiHelper.getText(binding.etBirthday));

        DatePickerDialog dialog = new DatePickerDialog(
                requireContext(),
                (view, year, month, dayOfMonth) -> {
                    String formatted = String.format(
                            Locale.US,
                            "%04d-%02d-%02d",
                            year,
                            month + 1,
                            dayOfMonth
                    );
                    binding.etBirthday.setText(formatted);
                },
                initialDate.getYear(),
                initialDate.getMonthValue() - 1,
                initialDate.getDayOfMonth()
        );

        dialog.getDatePicker().setMaxDate(System.currentTimeMillis());
        dialog.show();
    }

    private void handleCompleteProfile() {
        clearErrors();

        String displayName = UiHelper.getText(binding.etDisplayName);
        String birthday = UiHelper.getText(binding.etBirthday);
        String gender = normalizeGenderForApi(binding.etGender.getText() == null
                ? null
                : binding.etGender.getText().toString());

        String firstName = UiHelper.getText(binding.etFirstName);
        String lastName = UiHelper.getText(binding.etLastName);
        String phoneNumber = UiHelper.getText(binding.etPhone);

        if (displayName.isEmpty()) {
            binding.tilDisplayName.setError(getString(R.string.error_required_field));
            return;
        }

        if (birthday.isEmpty()) {
            binding.tilBirthday.setError(getString(R.string.error_required_field));
            return;
        }

        if (gender == null) {
            binding.tilGender.setError(getString(R.string.error_required_field));
            return;
        }

        if (isGoogleMode) {
            if (lastName.isEmpty()) {
                binding.tilLastName.setError(getString(R.string.error_required_field));
                return;
            }

            if (firstName.isEmpty()) {
                binding.tilFirstName.setError(getString(R.string.error_required_field));
                return;
            }

            if (phoneNumber.isEmpty()) {
                binding.tilPhone.setError(getString(R.string.error_required_field));
                return;
            }

            if (!PHONE_PATTERN.matcher(phoneNumber).matches()) {
                binding.tilPhone.setError(getString(R.string.error_invalid_phone));
                return;
            }
        } else {
            firstName = null;
            lastName = null;
            phoneNumber = null;
        }

        completeProfileViewModel.completeProfile(
                firstName,
                lastName,
                phoneNumber,
                birthday,
                gender,
                avatarUrl,
                displayName
        );
    }

    private void clearErrors() {
        binding.tilDisplayName.setError(null);
        binding.tilLastName.setError(null);
        binding.tilFirstName.setError(null);
        binding.tilPhone.setError(null);
        binding.tilBirthday.setError(null);
        binding.tilGender.setError(null);
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        binding.btnCompleteProfile.setEnabled(!isLoading);
    }

    private void navigateToChatApp() {
        Intent intent = new Intent();
        intent.setClassName(requireContext(), CHAT_APP_ACTIVITY_CLASS);
        startActivity(intent);
        requireActivity().finish();
    }

    private String normalizeGenderForApi(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }

        String upperCase = normalized.toUpperCase(Locale.ROOT);
        if ("MALE".equals(upperCase) || "NAM".equals(upperCase)) {
            return "MALE";
        }

        if ("FEMALE".equals(upperCase) || "NU".equals(upperCase) || "NỮ".equals(upperCase)) {
            return "FEMALE";
        }

        if ("OTHER".equals(upperCase) || "KHAC".equals(upperCase) || "KHÁC".equals(upperCase)) {
            return "OTHER";
        }

        return null;
    }

    private String formatGenderForDisplay(String gender) {
        String normalized = normalizeGenderForApi(gender);
        if (normalized == null) {
            return "";
        }

        switch (normalized) {
            case "MALE":
                return getString(R.string.gender_male);
            case "FEMALE":
                return getString(R.string.gender_female);
            default:
                return getString(R.string.gender_other);
        }
    }

    private LocalDate parseBirthdayOrToday(String birthday) {
        String normalized = normalize(birthday);
        if (normalized == null) {
            return LocalDate.now();
        }

        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ignored) {
            return LocalDate.now();
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
