package com.dang.app.service.auth;

import com.dang.app.entity.auth.User;
import com.dang.app.repository.auth.UserProfileRepository;
import com.dang.app.repository.auth.UserRepository;
import com.dang.app.utils.enums.AuthProvider;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_shouldAllowNullUsernameForGoogleSignUp() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        User created = userService.createUser(null, null, Set.of(AuthProvider.GOOGLE));

        verify(userRepository, never()).existsByUsername(any());
        assertNull(created.getUsername());
        assertTrue(created.getAuthProviders().contains(AuthProvider.GOOGLE));
    }

    @Test
    void createUser_shouldTrimUsernameAndThrowUsernameExistsWhenTaken() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> userService.createUser("  alice  ", "encoded-password", null)
        );

        assertEquals(ErrorCode.USERNAME_EXISTS, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_shouldPersistTrimmedUsername() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0, User.class));

        userService.createUser("  alice  ", "encoded-password", null);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("alice", userCaptor.getValue().getUsername());
        assertTrue(userCaptor.getValue().getAuthProviders().contains(AuthProvider.LOCAL));
    }
}
