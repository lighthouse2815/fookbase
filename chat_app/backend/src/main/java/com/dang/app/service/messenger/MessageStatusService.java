package com.dang.app.service.messenger;

import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.Message;
import com.dang.app.entity.messenger.MessageStatus;
import com.dang.app.repository.messenger.MessageStatusRepository;
import com.dang.app.utils.enums.MessageDeliveryStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class MessageStatusService {

    private final MessageStatusRepository messageStatusRepository;

    public void createStatusForMembers(Message message, List<User> members) {
        List<MessageStatus> statusList = members.stream()
                .map(member -> MessageStatus.builder()
                        .message(message)
                        .user(member)
                        .status(MessageDeliveryStatus.SENT)
                        .updatedAt(LocalDateTime.now())
                        .build())
                .toList();

        messageStatusRepository.saveAll(statusList);

    }

    public Map<UUID, Integer> getUnreadCountMap(UUID userId) {
        return messageStatusRepository.countUnreadByUser(userId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Long) row[1]).intValue()
                ));
    }

}

