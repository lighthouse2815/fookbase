package com.dangngulon.frontend.core.di;

import com.dangngulon.frontend.feature.auth.data.repository.AuthRepository;
import com.dangngulon.frontend.feature.profile.data.repository.UserProfileRepository;
import com.dangngulon.frontend.feature.zola.data.repository.AddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IFriendshipRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IAddFriendProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMediaRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IMessageRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ContactRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ConversationRepository;
import com.dangngulon.frontend.feature.auth.domain.repository.IAuthRepository;
import com.dangngulon.frontend.feature.profile.domain.repository.IUserProfileRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IContactRepository;
import com.dangngulon.frontend.feature.zola.domain.repository.IConversationRepository;
import com.dangngulon.frontend.feature.zola.data.repository.FriendshipRepository;
import com.dangngulon.frontend.feature.zola.data.repository.MediaRepository;
import com.dangngulon.frontend.feature.zola.data.repository.MessageRepository;

import javax.inject.Singleton;

import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public abstract class RepositoryModule {

    @Binds
    @Singleton
    public abstract IAuthRepository bindAuthRepository(AuthRepository impl);

    @Binds
    @Singleton
    public abstract IUserProfileRepository bindUserProfileRepository(UserProfileRepository impl);

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
    public abstract IFriendshipRepository bindFriendShipRepository(FriendshipRepository impl);

    @Binds
    @Singleton
    public abstract IMessageRepository bindMessageRepository(MessageRepository impl);
}
