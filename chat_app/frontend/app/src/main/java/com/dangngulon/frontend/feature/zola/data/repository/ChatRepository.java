package com.dangngulon.frontend.feature.zola.data.repository;

import android.util.Log;

import com.dangngulon.frontend.feature.zola.data.mapper.MessageDataMapper;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageResponse;
import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;
import com.dangngulon.frontend.core.network.socket.SocketManager;
import com.google.gson.Gson;

import java.util.function.Consumer;

import javax.inject.Inject;
import javax.inject.Singleton;

import io.reactivex.disposables.Disposable;

@Singleton
public class ChatRepository implements IChatRepository {

    private static final String TAG = "ChatRepository";

    private final SocketManager socketManager;
    private final Gson gson;

    @Inject
    public ChatRepository(SocketManager socketManager, Gson gson) {
        this.socketManager = socketManager;
        this.gson = gson;
    }

    @Override
    public Runnable subscribeMessages(
            String conversationId,
            Consumer<Message> onMessage
    ) {
        if (onMessage == null) {
            return () -> { };
        }

        String topic = "/user/queue/conversation/" + conversationId + "/messages";
        Disposable subscription = socketManager.subscribe(topic, payload -> {
            try {
                MessageResponse response = gson.fromJson(payload, MessageResponse.class);
                Message message = MessageDataMapper.toDomain(response);
                if (message != null) {
                    onMessage.accept(message);
                } else {
                    Log.w(TAG, "Socket payload parsed to null message");
                }
            } catch (Exception exception) {
                Log.e(TAG, "Failed to parse message payload from socket", exception);
            }
        });

        return () -> {
            if (!subscription.isDisposed()) {
                subscription.dispose();
            }
        };
    }

    @Override
    public void sendMessage(SendMessageCommand command) {
        com.dangngulon.frontend.feature.zola.data.remote.dto.request.SendMessageRequest request =
                MessageDataMapper.toRequest(command);
        socketManager.send("/app/chat.send", gson.toJson(request));
    }
}
