package com.dangngulon.frontend.feature.zola.data.di;

import com.dangngulon.frontend.feature.zola.data.repository.AddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ChatRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ContactRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ConversationRepository;
import com.dangngulon.frontend.feature.zola.data.repository.FriendshipRepository;
import com.dangngulon.frontend.feature.zola.data.repository.MediaRepository;
import com.dangngulon.frontend.feature.zola.data.repository.MessageRepository;
import com.dangngulon.frontend.feature.zola.data.repository.UploadRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IContactRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMediaRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IUploadRepository;

import javax.inject.Singleton;

import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public abstract class ZolaRepositoryModule {

    @Binds
    @Singleton
    public abstract IAddFriendProfileRepository bindAddFriendProfileRepository(AddFriendProfileRepository impl);

    @Binds
    @Singleton
    public abstract IContactRepository bindContactRepository(ContactRepository impl);

    @Binds
    @Singleton
    public abstract IConversationRepository bindConversationRepository(ConversationRepository impl);

    @Binds
    @Singleton
    public abstract IMediaRepository bindMediaRepository(MediaRepository impl);

    @Binds
    @Singleton
    public abstract IFriendshipRepository bindFriendshipRepository(FriendshipRepository impl);

    @Binds
    @Singleton
    public abstract IMessageRepository bindMessageRepository(MessageRepository impl);

    @Binds
    @Singleton
    public abstract IChatRepository bindChatRepository(ChatRepository impl);

    @Binds
    @Singleton
    public abstract IUploadRepository bindUploadRepository(UploadRepository impl);
}
