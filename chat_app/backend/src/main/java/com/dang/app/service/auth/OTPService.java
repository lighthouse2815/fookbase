package com.dang.app.service.auth;

import com.dang.app.entity.auth.OTP;
import com.dang.app.entity.auth.User;
import com.dang.app.repository.auth.OTPRepository;
import com.dang.app.service.other.MailService;
import com.dang.app.utils.enums.OTPType;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.utils.enums.OTPMailType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OTPService {

    private final MailService mailService;

    private final OTPRepository otpRepository;

    private final PasswordEncoder passwordEncoder;

    private static final long OTP_RESEND_SECONDS = 60;


    /*
    * Hàm kiểm tra gửi lại otp tránh spam
    * 60S gửi 1 lần
    * */
    private void checkOtpRateLimit(User user, OTPType type) {
        otpRepository.findTopByUserAndTypeOrderByCreatedAtDesc(user, type)
                .ifPresent(otp -> {
                    LocalDateTime nextAllowedTime =
                            otp.getCreatedAt().plusSeconds(OTP_RESEND_SECONDS);

                    if (LocalDateTime.now().isBefore(nextAllowedTime)) {
                        long retryAfter = Duration.between(
                                LocalDateTime.now(),
                                nextAllowedTime
                        ).getSeconds();

                        throw new BusinessException(
                                ErrorCode.OTP_TOO_FREQUENT,
                                Map.of("retryAfter", retryAfter)
                        );
                    }
                });
    }



    /*
    * Hàm tạo otp xác minh email , otp hoạt động 2 phút
    * dùng cho xác minh email và quên mật khẩu
    *  1. Kiểm tra đã đủ 60s chưa
    *  2. Xóa các otp trước
    *  3. tạo otp ngẫu nhiên
    *  4. hash otp
    *  5. tạo entity otp
    */
    @Transactional
    protected String createOTP(User user, OTPType type) {
        checkOtpRateLimit(user, type);
        otpRepository.deleteByUserAndType(user, type);

        String otp = String.format("%06d",
                ThreadLocalRandom.current().nextInt(0, 1_000_000));

        String otpHash = passwordEncoder.encode(otp);

        OTP entity = OTP.builder()
                .otpCode(otpHash)
                .user(user)
                .expiredAt(LocalDateTime.now().plusMinutes(2))
                .type(type)
                .build();

        otpRepository.save(entity);

        return otp;
    }


    @Transactional
    public void createAndsendOTP(
            User user,
            String email,
            OTPType otpType,
            OTPMailType mailType
    ){
        String otp = createOTP(user,otpType);
        mailService.sendOTPEmail(email, otp, mailType);
    }


    /*
    * Hàm kiểm tra otp
    *
    * */
    public void verifyOTP(
            UUID userId,
            String otp,
            OTPType type
    ) {
        OTP otpEntity = otpRepository.findByUser_idAndType(userId, type)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_OTP));

        if (otpEntity.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        if (otpEntity.getUsedAt() != null) {
            throw new BusinessException(ErrorCode.OTP_ALREADY_USED);
        }

        if(!passwordEncoder.matches(otp,otpEntity.getOtpCode())){
            throw new BusinessException(ErrorCode.INVALID_OTP);
        }

        otpEntity.setUsedAt(LocalDateTime.now());
        otpRepository.save(otpEntity);
    }


}

