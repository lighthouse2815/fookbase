package com.dangngulon.frontend.feature.zola.presentation.mapper;

import com.dangngulon.frontend.feature.zola.domain.model.Attachment;
import com.dangngulon.frontend.feature.zola.domain.model.AttachmentCommand;
import com.dangngulon.frontend.feature.zola.domain.model.Contact;
import com.dangngulon.frontend.feature.zola.domain.model.Conversation;
import com.dangngulon.frontend.feature.zola.domain.model.Friendship;
import com.dangngulon.frontend.feature.zola.domain.model.Message;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursor;
import com.dangngulon.frontend.feature.zola.domain.model.MessageCursorPage;
import com.dangngulon.frontend.feature.zola.domain.model.PendingFriendRequester;
import com.dangngulon.frontend.feature.zola.domain.model.RecentUserChat;
import com.dangngulon.frontend.feature.zola.presentation.model.AttachmentUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.ContactUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.ConversationUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendRequestUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.FriendshipUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageCursorPageUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageCursorUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.MessageUiModel;
import com.dangngulon.frontend.feature.zola.presentation.model.SelectableContactItem;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class ZolaUiMapper {

    private ZolaUiMapper() {
    }

    public static ConversationUiModel toUiModel(Conversation conversation) {
        if (conversation == null) {
            return null;
        }

        return new ConversationUiModel(
                conversation.getConversationId(),
                conversation.getName(),
                conversation.getAvatarUrl(),
                conversation.getType(),
                conversation.getLastSenderId(),
                conversation.getLastMessagePreview(),
                conversation.getLastSenderName(),
                conversation.getLastMessageAt(),
                conversation.getUnreadCount(),
                conversation.isHasUnread(),
                conversation.getMemberCount()
        );
    }

    public static List<ConversationUiModel> toConversationUiList(List<Conversation> conversations) {
        if (conversations == null || conversations.isEmpty()) {
            return Collections.emptyList();
        }

        return conversations.stream()
                .map(ZolaUiMapper::toUiModel)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static ContactUiModel toUiModel(Contact contact) {
        if (contact == null) {
            return null;
        }

        return new ContactUiModel(
                contact.getContactId(),
                contact.getUserId(),
                contact.getAvatarUrl(),
                contact.getNickName(),
                contact.getPhoneNumber()
        );
    }

    public static List<ContactUiModel> toContactUiList(List<Contact> contacts) {
        if (contacts == null || contacts.isEmpty()) {
            return Collections.emptyList();
        }

        return contacts.stream()
                .map(ZolaUiMapper::toUiModel)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static FriendRequestUiModel toUiModel(PendingFriendRequester requester) {
        if (requester == null) {
            return null;
        }

        return new FriendRequestUiModel(
                requester.getUserId(),
                requester.getDisplayName(),
                requester.getAvatarUrl(),
                requester.isRequester(),
                requester.getCreatedAt()
        );
    }

    public static List<FriendRequestUiModel> toFriendRequestUiList(List<PendingFriendRequester> requesters) {
        if (requesters == null || requesters.isEmpty()) {
            return Collections.emptyList();
        }

        return requesters.stream()
                .map(ZolaUiMapper::toUiModel)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static FriendshipUiModel toUiModel(Friendship friendship) {
        if (friendship == null) {
            return null;
        }

        return new FriendshipUiModel(
                friendship.getFriendshipId(),
                friendship.getUserId(),
                friendship.getUsername(),
                friendship.getStatus(),
                friendship.getCreatedAt(),
                friendship.getUpdatedAt()
        );
    }

    public static SelectableContactItem fromRecentUserChat(RecentUserChat source) {
        if (source == null) {
            return null;
        }

        return new SelectableContactItem(
                source.getUserId(),
                source.getUsername(),
                source.getAvatar(),
                "",
                source.getLastChatTime()
        );
    }

    public static SelectableContactItem fromContact(Contact source) {
        if (source == null) {
            return null;
        }

        return new SelectableContactItem(
                source.getUserId(),
                source.getNickName(),
                source.getAvatarUrl(),
                source.getPhoneNumber(),
                null
        );
    }

    public static List<SelectableContactItem> fromRecentUserChatList(List<RecentUserChat> source) {
        if (source == null || source.isEmpty()) {
            return Collections.emptyList();
        }

        return source.stream()
                .map(ZolaUiMapper::fromRecentUserChat)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static List<SelectableContactItem> fromContactList(List<Contact> source) {
        if (source == null || source.isEmpty()) {
            return Collections.emptyList();
        }

        return source.stream()
                .map(ZolaUiMapper::fromContact)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static MessageUiModel toUiModel(Message message) {
        if (message == null) {
            return null;
        }

        return new MessageUiModel(
                message.getMessageId(),
                message.getConversationId(),
                message.getSenderId(),
                message.getSenderName(),
                message.getContent(),
                toAttachmentUiList(message.getAttachments()),
                message.getStatus(),
                message.getType(),
                message.getCreatedAt()
        );
    }

    public static List<MessageUiModel> toMessageUiList(List<Message> messages) {
        if (messages == null || messages.isEmpty()) {
            return Collections.emptyList();
        }

        return messages.stream()
                .map(ZolaUiMapper::toUiModel)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public static MessageCursorPageUiModel toUiModel(MessageCursorPage page) {
        if (page == null) {
            return null;
        }

        return new MessageCursorPageUiModel(
                toMessageUiList(page.getMessages()),
                toUiModel(page.getNextCursor())
        );
    }

    public static MessageCursorUiModel toUiModel(MessageCursor cursor) {
        if (cursor == null) {
            return null;
        }
        return new MessageCursorUiModel(cursor.getCreatedAt(), cursor.getMessageId());
    }

    public static List<AttachmentCommand> toAttachmentCommands(List<AttachmentUiModel> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return Collections.emptyList();
        }

        return attachments.stream()
                .map(value -> new AttachmentCommand(
                        value.getUrl(),
                        value.getFileName(),
                        value.getType(),
                        value.getFileSize(),
                        value.getContentType()
                ))
                .collect(Collectors.toList());
    }

    private static List<AttachmentUiModel> toAttachmentUiList(List<Attachment> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return Collections.emptyList();
        }

        return attachments.stream()
                .map(value -> new AttachmentUiModel(
                        value.getAttachmentId(),
                        value.getUrl(),
                        value.getType(),
                        value.getFileName(),
                        value.getFileSize(),
                        value.getContentType()
                ))
                .collect(Collectors.toList());
    }
}
