package com.dang.app.utils.error;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Setter
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private final transient Map<String, Object> data;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, null);
    }

    public BusinessException(ErrorCode errorCode, Map<String, Object> data) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.data = data;
    }

}


