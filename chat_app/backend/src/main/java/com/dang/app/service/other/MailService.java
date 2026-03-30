package com.dang.app.service.other;

import com.dang.app.utils.enums.OTPMailType;
import lombok.AllArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    /*
     * Hàm gửi email chứa mã otp
     * */
    @Async
    public void sendOTPEmail(String email, String otp, OTPMailType type) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(type.subject());
        message.setText("""
        %s :

        %s

        Mã xác nhận có hiệu lực trong 2 phút.
        Vui lòng không chia sẻ mã này với bất kỳ ai.
        """.formatted(type.title(), otp));

        mailSender.send(message);
    }
}
