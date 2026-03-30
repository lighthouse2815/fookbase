package com.dang.app.service.messenger;

import com.dang.app.dto.messenger.other.SendMessageResult;
import com.dang.app.dto.messenger.request.AttachmentRequest;
import com.dang.app.dto.messenger.request.SendMessageRequest;
import com.dang.app.dto.messenger.response.AttachmentResponse;
import com.dang.app.dto.messenger.response.MessageCursor;
import com.dang.app.dto.messenger.response.MessageCursorPageResponse;
import com.dang.app.dto.messenger.response.MessageResponse;
import com.dang.app.entity.auth.User;
import com.dang.app.entity.messenger.Conversation;
import com.dang.app.entity.messenger.Message;
import com.dang.app.repository.messenger.AttachmentRepository;
import com.dang.app.repository.messenger.MessageRepository;
import com.dang.app.repository.projection.messenger.MessageProjection;
import com.dang.app.service.auth.UserService;
import com.dang.app.utils.enums.MessageType;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.guard.ConversationGuard;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.mapper.AttachmentMapper;
import com.dang.app.utils.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final int DEFAULT_MESSAGE_LIMIT = 20;
    private static final int MAX_MESSAGE_LIMIT = 100;
    private static final int PREVIEW_MAX_LENGTH = 200;
    private static final String ATTACHMENT_PREVIEW = "[Attachment]";

    private final UserService userService;
    private final AttachmentService attachmentService;
    private final ConversationService conversationService;
    private final ConversationMemberService conversationMemberService;
    private final MessageStatusService messageStatusService;
    private final AttachmentMapper attachmentMapper;
    private final MessageMapper messageMapper;
    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final UserGuard userGuard;
    private final ConversationGuard conversationGuard;

    @Transactional
    public SendMessageResult sendMessage(SendMessageRequest request, UUID senderId) {
        User sender = userService.findById(senderId);
        userGuard.requireActiveAndNotDeleted(sender);

        Conversation conversation = conversationService.findById(request.getConversationId());
        conversationGuard.requireActiveMember(conversation.getId(), senderId);

        String normalizedContent = normalizeContent(request.getContent());
        List<AttachmentRequest> attachmentsRequest = request.getAttachments();
        validateMessagePayload(normalizedContent, attachmentsRequest);
        boolean hasAttachments = attachmentsRequest != null && !attachmentsRequest.isEmpty();
        MessageType messageType = hasAttachments ? MessageType.ATTACHMENT : MessageType.TEXT;

        Message message = messageRepository.save(
                Message.builder()
                        .conversation(conversation)
                        .sender(sender)
                        .content(normalizedContent)
                        .type(messageType)
                        .build()
        );

        List<AttachmentResponse> attachments = List.of();
        if (hasAttachments) {
            attachments = attachmentService.saveAttachments(attachmentsRequest, message);
        }

        String lastMessagePreview = buildPreview(normalizedContent, hasAttachments);
        conversationService.setupLastMessage(conversation, message, lastMessagePreview);

        List<User> members = getActiveRecipients(conversation.getId(), senderId);
        messageStatusService.createStatusForMembers(message, members);

        MessageResponse response = messageMapper.toMessageResponse(message, attachments);

        // gửi cho toàn bộ member trong conversation

        return SendMessageResult.builder()
                .response(response)
                .recipients(members)
                .build();
    }

    @Transactional(readOnly = true)
    public MessageCursorPageResponse getMessages(
            UUID conversationId,
            UUID userId,
            Instant cursorCreatedAt,
            UUID cursorMessageId,
            int limit
    ) {
        User user = userService.findById(userId);
        userGuard.requireActiveAndNotDeleted(user);

        Conversation conversation = conversationService.findById(conversationId);
        conversationGuard.requireActiveMember(conversation.getId(), userId);

        validateCursor(cursorCreatedAt, cursorMessageId);

        int safeLimit = normalizeLimit(limit);
        LocalDateTime localCursorCreatedAt = toLocalDateTime(cursorCreatedAt);

        List<MessageProjection> fetchedMessages = messageRepository.findMessageProjectionsByConversationId(
                conversationId,
                userId,
                localCursorCreatedAt,
                cursorMessageId,
                safeLimit + 1
        );

        boolean hasNext = fetchedMessages.size() > safeLimit;
        List<MessageProjection> currentBatch = hasNext
                ? fetchedMessages.subList(0, safeLimit)
                : fetchedMessages;

        Map<UUID, List<AttachmentResponse>> attachmentsByMessageId = getAttachmentsByMessageId(currentBatch);

        List<MessageResponse> messages = currentBatch.stream()
                .map(message -> messageMapper.toMessageResponse(
                        message,
                        attachmentsByMessageId.getOrDefault(message.getMessageId(), List.of())
                ))
                .toList();

        MessageCursor nextCursor = hasNext
                ? buildNextCursor(currentBatch.get(currentBatch.size() - 1))
                : null;

        return MessageCursorPageResponse.builder()
                .messages(messages)
                .nextCursor(nextCursor)
                .build();
    }

    private List<User> getActiveRecipients(UUID conversationId, UUID senderId) {
        return conversationMemberService.findActiveMembersExcludingUser(conversationId, senderId);
    }

    private void validateMessagePayload(String content, List<AttachmentRequest> attachments) {
        boolean hasContent = StringUtils.hasText(content);
        boolean hasAttachments = attachments != null && !attachments.isEmpty();

        if (!hasContent && !hasAttachments) {
            throw new BusinessException(ErrorCode.MESSAGE_EMPTY);
        }
    }

    private String normalizeContent(String content) {
        if (content == null) {
            return null;
        }

        String trimmed = content.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildPreview(String content, boolean hasAttachments) {
        String normalizedContent = normalizeContent(content);
        if (!StringUtils.hasText(normalizedContent)) {
            return hasAttachments ? ATTACHMENT_PREVIEW : "";
        }

        if (normalizedContent.length() <= PREVIEW_MAX_LENGTH) {
            return normalizedContent;
        }

        return normalizedContent.substring(0, PREVIEW_MAX_LENGTH - 3) + "...";
    }

    private void validateCursor(Instant cursorCreatedAt, UUID cursorMessageId) {
        if ((cursorCreatedAt == null) == (cursorMessageId == null)) {
            return;
        }

        throw new BusinessException(ErrorCode.INVALID_CURSOR);
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_MESSAGE_LIMIT;
        }

        return Math.min(limit, MAX_MESSAGE_LIMIT);
    }

    private LocalDateTime toLocalDateTime(Instant value) {
        if (value == null) {
            return null;
        }

        return LocalDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    private Map<UUID, List<AttachmentResponse>> getAttachmentsByMessageId(List<MessageProjection> messages) {
        if (messages.isEmpty()) {
            return Map.of();
        }

        List<UUID> messageIds = messages.stream()
                .map(MessageProjection::getMessageId)
                .toList();

        Map<UUID, List<AttachmentResponse>> attachmentsByMessageId = new LinkedHashMap<>();
        messageIds.forEach(messageId -> attachmentsByMessageId.put(messageId, List.of()));

        attachmentRepository.findByMessage_IdInAndDeletedAtIsNullOrderByCreatedAtAsc(messageIds).stream()
                .collect(Collectors.groupingBy(
                        attachment -> attachment.getMessage().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(attachmentMapper::toAttachmentResponse, Collectors.toList())
                ))
                .forEach(attachmentsByMessageId::put);

        return attachmentsByMessageId;
    }

    private MessageCursor buildNextCursor(MessageProjection message) {
        return MessageCursor.builder()
                .createdAt(message.getCreatedAt())
                .messageId(message.getMessageId())
                .build();
    }
}
