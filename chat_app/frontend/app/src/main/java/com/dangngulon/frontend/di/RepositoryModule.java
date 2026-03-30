package com.dangngulon.frontend.di;

import com.dangngulon.frontend.repository.auth_impl.AuthRepositoryImpl;
import com.dangngulon.frontend.repository.auth_impl.UserProfileRepositoryImpl;
import com.dangngulon.frontend.repository.zola.FriendshipRepository;
import com.dangngulon.frontend.repository.zola.MediaRepository;
import com.dangngulon.frontend.repository.zola.MessageRepository;
import com.dangngulon.frontend.repository.zola_impl.ContactRepositoryImpl;
import com.dangngulon.frontend.repository.zola_impl.ConversationRepositoryImpl;
import com.dangngulon.frontend.repository.auth.AuthRepository;
import com.dangngulon.frontend.repository.auth.UserProfileRepository;
import com.dangngulon.frontend.repository.zola.ContactRepository;
import com.dangngulon.frontend.repository.zola.ConversationRepository;
import com.dangngulon.frontend.repository.zola_impl.FriendshipRepositoryImpl;
import com.dangngulon.frontend.repository.zola_impl.MediaRepositoryImpl;
import com.dangngulon.frontend.repository.zola_impl.MessageRepositoryImpl;

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
    public abstract AuthRepository bindAuthRepository(AuthRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract UserProfileRepository bindUserProfileRepository(UserProfileRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract ContactRepository bindContactRepository(ContactRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract ConversationRepository bindConversationRepository(ConversationRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract MediaRepository bindMediaRepository(MediaRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract FriendshipRepository bindFriendShipRepository(FriendshipRepositoryImpl impl);

    @Binds
    @Singleton
    public abstract MessageRepository bindMessageRepository(MessageRepositoryImpl impl);
}
