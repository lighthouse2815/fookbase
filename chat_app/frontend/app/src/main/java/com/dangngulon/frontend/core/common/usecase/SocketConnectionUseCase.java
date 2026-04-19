package com.dangngulon.frontend.core.common.usecase;

import com.dangngulon.frontend.core.network.socket.SocketManager;

import javax.inject.Inject;

public class SocketConnectionUseCase {
    private final SocketManager socketManager;

    @Inject
    public SocketConnectionUseCase(SocketManager socketManager) {
        this.socketManager = socketManager;
    }

    public void connect() {
        socketManager.connect();
    }

    public void disconnect() {
        socketManager.disconnect();
    }
}
