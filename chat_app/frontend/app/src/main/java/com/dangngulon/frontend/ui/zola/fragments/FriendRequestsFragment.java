package com.dangngulon.frontend.ui.zola.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentFriendRequestsBinding;
import com.dangngulon.frontend.model.zola.response.PendingFriendRequesterResponse;
import com.dangngulon.frontend.ui.common.helpers.UiHelper;
import com.dangngulon.frontend.ui.zola.adapters.FriendRequestAdapter;
import com.dangngulon.frontend.utils.enums.ButtonType;
import com.dangngulon.frontend.utils.others.Result;
import com.dangngulon.frontend.viewmodel.zola.FriendRequestViewModel;
import com.google.android.material.tabs.TabLayout;

import java.util.ArrayList;
import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class FriendRequestsFragment extends Fragment {

    private static final int TAB_RECEIVED = 0;
    private static final int TAB_SENT = 1;

    private FragmentFriendRequestsBinding binding;
    private FriendRequestAdapter adapter;
    private FriendRequestViewModel viewModel;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentFriendRequestsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        setupViewModel();
        showTabLayout();
        setupToolbar();
        setupRecyclerView();
        setupTabs();
        observeViewModel();

        loadPendingRequesters();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void setupViewModel() {
        viewModel = new ViewModelProvider(this).get(FriendRequestViewModel.class);
    }

    private void observeViewModel() {
        observeLoadPendingRequesters();
        observeLoadSendList();
        observeLoadReceiveList();
    }

    private void observeLoadPendingRequesters() {
        viewModel.getPendingRequesterResult().observe(getViewLifecycleOwner(), result -> viewModel.handleResult(result));
    }

    private void observeLoadSendList() {
        viewModel.getSendList().observe(
                getViewLifecycleOwner(),
                result -> renderTabResult(result, TAB_SENT)
        );
    }

    private void observeLoadReceiveList() {
        viewModel.getReceivedList().observe(
                getViewLifecycleOwner(),
                result -> renderTabResult(result, TAB_RECEIVED)
        );
    }

    private void loadPendingRequesters() {
        viewModel.loadData();
    }

    private void showTabLayout() {
        TabLayout tabLayout = binding.requestTabLayout;
        tabLayout.removeAllTabs();
        tabLayout.addTab(tabLayout.newTab().setText(R.string.tab_received));
        tabLayout.addTab(tabLayout.newTab().setText(R.string.tab_sent));
        tabLayout.selectTab(tabLayout.getTabAt(TAB_RECEIVED));
    }

    private void setupToolbar() {
        binding.toolbarTitle.setText(getString(R.string.friend_requests_title));
        binding.btnBack.setOnClickListener(v -> NavHostFragment.findNavController(this).popBackStack());
        binding.btnSettings.setOnClickListener(v ->
                UiHelper.showToast(requireContext(), getString(R.string.settings_coming_soon))
        );
    }

    private void setupRecyclerView() {
        adapter = new FriendRequestAdapter();
        adapter.setOnActionClickListener(new FriendRequestAdapter.OnActionClickListener() {
            @Override
            public void onReject(@NonNull PendingFriendRequesterResponse request) {
                UiHelper.showToast(requireContext(), getString(R.string.rejected_request, request.getDisplayName()));
                viewModel.rejectFriendRequest(request.getUserId());

                adapter.updateItemMode(request.getUserId(), ButtonType.REJECT);
            }

            @Override
            public void onAccept(@NonNull PendingFriendRequesterResponse request) {
                UiHelper.showToast(requireContext(), getString(R.string.accepted_request, request.getDisplayName()));
                viewModel.acceptFriendRequest(request.getUserId());

                adapter.updateItemMode(request.getUserId(), ButtonType.ACCEPT);
            }

            @Override
            public void onSentAction(@NonNull PendingFriendRequesterResponse request) {
                ButtonType currentMode = adapter.getItemMode(request.getUserId());

                if (currentMode == ButtonType.REJECT) {
                    adapter.updateItemMode(request.getUserId(), ButtonType.SENT);
                    return;
                }

                if (currentMode == ButtonType.SENT) {
                    adapter.updateItemMode(request.getUserId(), ButtonType.REJECT);
                    return;
                }

                UiHelper.showToast(requireContext(), getString(R.string.revoked_request, request.getDisplayName()));
                adapter.updateItemMode(request.getUserId(), ButtonType.SENT);
            }
        });

        binding.requestRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.requestRecyclerView.setAdapter(adapter);
    }

    private void setupTabs() {
        binding.requestTabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                ButtonType isSend = tab.getPosition() == TAB_SENT ? ButtonType.SENT : ButtonType.RECEIVED;
                adapter.setSendMode(isSend);
                renderCurrentTabFromCache();
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {}

            @Override
            public void onTabReselected(TabLayout.Tab tab) {}
        });
    }

    private void showLoading(boolean isLoading) {
        binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
    }

    private void showEmptyState() {
        binding.emptyState.setVisibility(View.VISIBLE);
        binding.requestRecyclerView.setVisibility(View.GONE);
        binding.emptyText.setText(
                binding.requestTabLayout.getSelectedTabPosition() == TAB_RECEIVED
                        ? getString(R.string.empty_received)
                        : getString(R.string.empty_sent)
        );
    }

    private void hideEmptyState() {
        binding.emptyState.setVisibility(View.GONE);
        binding.requestRecyclerView.setVisibility(View.VISIBLE);
    }

    private void renderCurrentTabFromCache() {
        int selectedTab = binding.requestTabLayout.getSelectedTabPosition();
        if (selectedTab == TAB_SENT) {
            renderTabResult(viewModel.getSendList().getValue(), TAB_SENT);
            return;
        }

        renderTabResult(viewModel.getReceivedList().getValue(), TAB_RECEIVED);
    }

    private void renderTabResult(Result<List<PendingFriendRequesterResponse>> result, int expectedTab) {
        if (result == null) return;
        if (binding.requestTabLayout.getSelectedTabPosition() != expectedTab) return;

        switch (result.getStatus()) {
            case LOADING:
                showLoading(true);
                break;

            case SUCCESS:
                showLoading(false);
                List<PendingFriendRequesterResponse> list = result.getData();

                if (list == null || list.isEmpty()) {
                    adapter.submitRequests(new ArrayList<>());
                    showEmptyState();
                } else {
                    hideEmptyState();
                    adapter.submitRequests(list);
                }
                break;

            case ERROR:
                showLoading(false);
                adapter.submitRequests(new ArrayList<>());
                showEmptyState();

                String errorMessage = result.getMessage();
                if (errorMessage == null || errorMessage.trim().isEmpty()) {
                    errorMessage = getString(R.string.load_friend_requests_failed);
                }
                UiHelper.showToast(requireContext(), errorMessage);
                break;
        }
    }
}
