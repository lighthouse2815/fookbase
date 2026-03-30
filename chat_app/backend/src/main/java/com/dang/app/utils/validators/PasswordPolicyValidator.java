package com.dang.app.utils.validators;

import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicyValidator {

    private PasswordPolicyValidator() {}

    public static void validate(String password) {

        if (password.length() < 8) {
            throw new BusinessException(
                    ErrorCode.PASSWORD_TOO_SHORT
            );
        }

        if (!password.matches(".*[A-Z].*")) {
            throw new BusinessException(
                    ErrorCode.PASSWORD_NO_UPPERCASE
            );
        }

        if (!password.matches(".*\\d.*")) {
            throw new BusinessException(
                    ErrorCode.PASSWORD_NO_NUMBER
            );
        }
    }

}

