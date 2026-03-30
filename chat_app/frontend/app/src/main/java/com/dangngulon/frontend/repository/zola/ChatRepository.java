package com.dangngulon.frontend.repository.zola;

import androidx.lifecycle.LiveData;

import com.dangngulon.frontend.model.zola.response.MessageResponse;
import com.dangngulon.frontend.model.zola.request.SendMessageRequest;

public interface ChatRepository {
    LiveData<MessageResponse> subscribeMessages(String conversationId, String userId);
    void sendMessage(SendMessageRequest request);
}
