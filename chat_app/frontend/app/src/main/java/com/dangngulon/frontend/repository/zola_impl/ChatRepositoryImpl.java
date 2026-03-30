package com.dangngulon.frontend.repository.zola_impl;

import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.model.zola.request.SendMessageRequest;
import com.dangngulon.frontend.repository.zola.ChatRepository;
import com.dangngulon.frontend.utils.socket.SocketManager;
import com.google.gson.Gson;

import javax.inject.Inject;
import javax.inject.Singleton;

import io.reactivex.disposables.Disposable;

@Singleton
public class ChatRepositoryImpl implements ChatRepository {

    private static final String TAG = "ChatRepository";

    private final SocketManager socketManager;
    private final Gson gson;
    private Disposable messageSubscription;

    @Inject
    public ChatRepositoryImpl(SocketManager socketManager, Gson gson) {
        this.socketManager = socketManager;
        this.gson = gson;
    }

    @Override
    public LiveData<MessageResponse> subscribeMessages(String conversationId, String userId) {

        MutableLiveData<MessageResponse> liveData = new MutableLiveData<>();

        if (messageSubscription != null && !messageSubscription.isDisposed()) {
            messageSubscription.dispose();
        }

        String topic = "/user/queue/conversation/" + conversationId + "/messages";
        messageSubscription = socketManager.subscribe(topic, payload -> {
            try {
                MessageResponse message = gson.fromJson(payload, MessageResponse.class);
                if (message != null) {
                    liveData.postValue(message);
                } else {
                    Log.w(TAG, "Socket payload parsed to null message");
                }
            } catch (Exception exception) {
                Log.e(TAG, "Failed to parse message payload from socket", exception);
            }
        });

        return liveData;
    }

    @Override
    public void sendMessage(SendMessageRequest request) {
        socketManager.send("/app/chat.send", gson.toJson(request));
    }

    public void unsubscribeMessages() {
        if (messageSubscription != null && !messageSubscription.isDisposed()) {
            messageSubscription.dispose();
        }
    }
}
