package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.other.SendMessageResult;
import com.dang.app.dto.messenger.request.SendMessageRequest;
import com.dang.app.dto.messenger.response.MessageResponse;
import com.dang.app.entity.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatRealTimeService {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    public void sendRealTimeMessage(SendMessageRequest request, UUID senderId) {
        SendMessageResult result = messageService.sendMessage(request, senderId);
        MessageResponse response = result.getResponse();
        String userDestination = "/queue/conversation/" + response.getConversationId() + "/messages";

        // Broadcast to all online members involved in this chat event, including sender echo.
        Set<String> recipientUserIds = new LinkedHashSet<>();
        recipientUserIds.add(senderId.toString());
        for (User user : result.getRecipients()) {
            recipientUserIds.add(user.getId().toString());
        }

        for (String recipientUserId : recipientUserIds) {
            messagingTemplate.convertAndSendToUser(
                    recipientUserId,
                    userDestination,
                    response
            );
        }
    }

    public MessageResponse sendMessageRest(SendMessageRequest request, UUID senderId) {
        return messageService.sendMessage(request, senderId).getResponse();
    }
}
