package com.dang.app.utils.validators;

import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class PhonePolicyValidator {

    private PhonePolicyValidator() {}

    public void validate(String phone) {
        if (!phone.matches("^0\\d{9}$")) {
            throw new BusinessException(
                    ErrorCode.INVALID_PHONE
            );
        }
    }

}

