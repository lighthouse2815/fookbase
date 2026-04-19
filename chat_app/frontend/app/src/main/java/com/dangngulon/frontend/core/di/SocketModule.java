package com.dangngulon.frontend.core.di;

import com.dangngulon.frontend.feature.zola.domain.repository.IChatRepository;
import com.dangngulon.frontend.feature.zola.data.repository.ChatRepository;
import com.dangngulon.frontend.core.utils.data.AuthManager;
import com.dangngulon.frontend.core.network.socket.SocketManager;
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
    abstract IChatRepository bindChatRepository(ChatRepository chatRepository);
}
