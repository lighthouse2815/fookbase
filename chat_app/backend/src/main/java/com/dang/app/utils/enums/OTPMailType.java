package com.dang.app.utils.enums;

public enum OTPMailType {
    EMAIL_VERIFY(
            "Email xác minh Zola",
            "Mã xác nhận của bạn là"
    ),
    PASSWORD_RESET(
            "Email đặt lại mật khẩu",
            "Mã đặt lại mật khẩu của bạn là"
    );

    private final String subject;
    private final String title;

    OTPMailType(String subject, String title) {
        this.subject = subject;
        this.title = title;
    }

    public String subject() {
        return subject;
    }

    public String title() {
        return title;
    }
}

