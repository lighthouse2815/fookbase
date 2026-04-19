package com.dang.app.utils.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(
            BusinessException ex,
            HttpServletRequest request
    ) {
        ErrorCode code = ex.getErrorCode();

        ApiError error = new ApiError(
                code.name(),
                code.getStatus(),
                code.getMessage(),
                request.getRequestURI(),
                ex.getData()
        );

        return ResponseEntity
                .status(code.getStatus())
                .body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnknown(
            Exception ex,
            HttpServletRequest request
    ) {
        ex.printStackTrace();

        ApiError error = new ApiError(
                "INTERNAL_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Có lỗi hệ thống",
                request.getRequestURI()
        );

        return ResponseEntity.status(500).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst()
                .orElse("Validation error");

        ApiError error = new ApiError(
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value(),
                message,
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        ApiError error = new ApiError(
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value(),
                "Invalid request body",
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            BindException.class,
            MissingServletRequestParameterException.class,
            ConstraintViolationException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiError error = new ApiError(
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value(),
                "Invalid request parameter",
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }


}

