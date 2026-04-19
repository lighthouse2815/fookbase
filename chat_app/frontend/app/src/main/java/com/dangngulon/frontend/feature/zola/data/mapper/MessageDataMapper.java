package com.dangngulon.frontend.feature.zola.data.mapper;

import com.dangngulon.frontend.feature.zola.data.remote.dto.request.AttachmentRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.request.SendMessageRequest;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.AttachmentResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageCursor;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageCursorPageResponse;
import com.dangngulon.frontend.feature.zola.data.remote.dto.response.MessageResponse;
import com.dangngulon.frontend.feature.zola.domain.model.Attachment;
import com.dangngulon.frontend.feature.zola.domain.model.AttachmentCommand;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.SendMessageCommand;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class MessageDataMapper {

    private MessageDataMapper() {
    }

    public static SendMessageRequest toRequest(SendMessageCommand command) {
        if (command == null) {
            return null;
        }

        return new SendMessageRequest(
                command.getConversationId(),
                command.getContent(),
                toAttachmentRequestList(command.getAttachments())
        );
    }

    public static Message toDomain(MessageResponse response) {
        if (response == null) {
            return null;
        }

        return new Message(
                response.getMessageId(),
                response.getConversationId(),
                response.getSenderId(),
                response.getSenderName(),
                response.getContent(),
                toAttachmentDomainList(response.getAttachments()),
                response.getStatus(),
                response.getType(),
                response.getCreatedAt()
        );
    }

    public static List<Message> toDomainList(List<MessageResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(MessageDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static MessageCursorPage toDomain(MessageCursorPageResponse response) {
        if (response == null) {
            return null;
        }

        return new MessageCursorPage(
                toDomainList(response.getMessages()),
                toDomain(response.getNextCursor())
        );
    }

    public static com.dangngulon.frontend.feature.zola.domain.model.MessageCursor toDomain(MessageCursor cursor) {
        if (cursor == null) {
            return null;
        }

        return new com.dangngulon.frontend.feature.zola.domain.model.MessageCursor(
                cursor.getCreatedAt(),
                cursor.getMessageId()
        );
    }

    private static List<AttachmentRequest> toAttachmentRequestList(List<AttachmentCommand> commands) {
        if (commands == null || commands.isEmpty()) {
            return Collections.emptyList();
        }

        return commands.stream()
                .map(value -> new AttachmentRequest(
                        value.getFileUrl(),
                        value.getFileName(),
                        value.getFileType(),
                        value.getFileSize(),
                        value.getContentType()
                ))
                .collect(Collectors.toList());
    }

    private static List<Attachment> toAttachmentDomainList(List<AttachmentResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return Collections.emptyList();
        }

        return responses.stream()
                .map(MessageDataMapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private static Attachment toDomain(AttachmentResponse response) {
        return new Attachment(
                response.getAttachmentId(),
                response.getUrl(),
                response.getType(),
                response.getFileName(),
                response.getFileSize(),
                response.getContentType()
        );
    }
}
