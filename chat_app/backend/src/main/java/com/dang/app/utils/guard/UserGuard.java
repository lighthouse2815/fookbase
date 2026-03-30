package com.dang.app.utils.guard;

import com.dang.app.entity.auth.OTP;
import com.dang.app.entity.auth.User;
import com.dang.app.utils.enums.AuthProvider;
import com.dang.app.utils.enums.OTPType;
import com.dang.app.utils.enums.Status;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Validated
@Component
public class UserGuard {

    public void requireActiveAndNotDeleted(@NotNull User user) {
        requireNotDeleted(user);

        if (user.getStatus() == Status.BANNED) {
            throw new BusinessException(ErrorCode.USER_BANNED);
        }

        if (user.getStatus() == Status.INACTIVE) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }
    }

    public void requireNotDeleted(@NotNull User user) {
        if (user.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.USER_DELETED);
        }
    }

    public void requireValidUserForOTP(User user, OTPType type) {
//        if (type == OTPType.PASSWORD_RESET) {
//            requireActiveAndNotDeleted(user);
//            return;
//        }
        requireNotDeleted(user);
    }

    public void requireHasProvider(
            @NotNull User user,
            @NotNull AuthProvider provider
    ) {
        if (!user.getAuthProviders().contains(provider)) {
            throw new BusinessException(ErrorCode.AUTH_PROVIDER_NOT_ALLOWED);
        }
    }


}
