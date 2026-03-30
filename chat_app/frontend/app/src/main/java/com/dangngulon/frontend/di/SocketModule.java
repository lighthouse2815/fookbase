package com.dangngulon.frontend.di;

import com.dangngulon.frontend.repository.zola.ChatRepository;
import com.dangngulon.frontend.repository.zola_impl.ChatRepositoryImpl;
import com.dangngulon.frontend.utils.data.AuthManager;
import com.dangngulon.frontend.utils.socket.SocketManager;
import dagger.Binds;
import dagger.Module;
import dagger.Provides;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

import javax.inject.Singleton;

@Module
@InstallIn(SingletonComponent.class)
public abstract class SocketModule {

    @Provides
    @Singleton
    static SocketManager provideSocketManager(AuthManager authManager) {
        return new SocketManager(authManager);
    }

    @Binds
    @Singleton
    abstract ChatRepository bindChatRepository(ChatRepositoryImpl chatRepositoryImpl);
}
