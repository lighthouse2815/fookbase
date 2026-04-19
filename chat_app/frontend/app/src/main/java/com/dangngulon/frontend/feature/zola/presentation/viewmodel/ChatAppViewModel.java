package com.dangngulon.frontend.feature.zola.presentation.viewmodel;

import androidx.lifecycle.ViewModel;

import com.dangngulon.frontend.core.common.usecase.SocketConnectionUseCase;

import javax.inject.Inject;

import dagger.hilt.android.lifecycle.HiltViewModel;

@HiltViewModel
public class ChatAppViewModel extends ViewModel {
    private final SocketConnectionUseCase socketConnectionUseCase;

    @Inject
    public ChatAppViewModel(SocketConnectionUseCase socketConnectionUseCase) {
        this.socketConnectionUseCase = socketConnectionUseCase;
    }

    public void connectSocket() {
        socketConnectionUseCase.connect();
    }

    public void disconnectSocket() {
        socketConnectionUseCase.disconnect();
    }
}
