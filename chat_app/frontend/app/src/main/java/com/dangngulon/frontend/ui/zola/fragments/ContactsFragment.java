package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentContactsBinding;
import com.dangngulon.frontend.model.zola.response.ContactResponse;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.ui.zola.adapters.ContactAdapter;
import com.dangngulon.frontend.viewmodel.zola.ContactViewModel;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class ContactsFragment extends Fragment {

    private ContactAdapter adapter;
    private ContactViewModel contactViewModel;
    private FragmentContactsBinding binding;


    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentContactsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        setupRecyclerView();
        setupClickListeners();
        observeViewModel();
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initViewModel();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadContacts();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void initViewModel(){
        contactViewModel = new ViewModelProvider(this)
                .get(ContactViewModel.class);
    }

    private void setupRecyclerView() {
        adapter = new ContactAdapter();
        binding.contactsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.contactsRecyclerView.setAdapter(adapter);

        adapter.setOnContactClickListener(contact -> {
            UiHelper.showToast(requireContext(), "Chat với: " + contact.getNickName());
            // TODO : nav đến chat
        });
    }

    private void setupClickListeners() {
        NavController navController = NavHostFragment.findNavController(this);

        binding.addFriendAction.setOnClickListener(v -> navController.navigate(
                R.id.action_global_addFriend
    ));
    }

    private void observeViewModel(){
        contactViewModel.getContactListResult()
                .observe(getViewLifecycleOwner(), result -> {
                    if (result == null) return;

                    switch (result.getStatus()) {
                        case LOADING:
                            if (adapter.getItemCount() == 0) {
                                showLoading(true);
                            }
                            break;

                        case SUCCESS:
                            showLoading(false);
                            List<ContactResponse> list = result.getData();

                            if (list == null || list.isEmpty()) {
                                showLoadingState();
                            } else {
                                hideLoadingState();
                                adapter.submitContactsList(list);
                            }
                            break;

                        case ERROR:
                            showLoading(false);
                            UiHelper.showToast(requireContext(), "lay danh ba that bai");
                            break;
                    }
                });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showLoadingState(){
        binding.emptyState.setVisibility(View.VISIBLE);
        binding.contactsRecyclerView.setVisibility(View.GONE);
    }

    private void hideLoadingState(){
        binding.emptyState.setVisibility(View.GONE);
        binding.contactsRecyclerView.setVisibility(View.VISIBLE);
    }

    private void loadContacts() {
        contactViewModel.getAllContacts();
    }
}
