package com.dangngulon.frontend.feature.profile.data.di;

import com.dangngulon.frontend.feature.profile.data.repository.UserProfileRepository;
import com.dangngulon.frontend.feature.profile.domain.repository.IUserProfileRepository;

import javax.inject.Singleton;

import dagger.Binds;
import dagger.Module;
import dagger.hilt.InstallIn;
import dagger.hilt.components.SingletonComponent;

@Module
@InstallIn(SingletonComponent.class)
public abstract class ProfileRepositoryModule {

    @Binds
    @Singleton
    public abstract IUserProfileRepository bindUserProfileRepository(UserProfileRepository impl);
}
