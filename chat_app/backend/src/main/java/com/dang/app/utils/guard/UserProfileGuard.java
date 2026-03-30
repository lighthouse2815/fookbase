package com.dang.app.utils.guard;

import com.dang.app.entity.auth.UserProfile;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Validated
@Component
public class UserProfileGuard {

    public void requireNotDeleted(@NotNull UserProfile userProfile){
        if(userProfile.getDeletedAt() != null){
            throw new BusinessException(ErrorCode.PROFILE_DELETED);
        }
    }

    public void requireNotCompleted(@NotNull UserProfile userProfile){
        if(userProfile.isCompleted()){
            throw new BusinessException(ErrorCode.PROFILE_ALREADY_COMPLETED);
        }
    }

}
