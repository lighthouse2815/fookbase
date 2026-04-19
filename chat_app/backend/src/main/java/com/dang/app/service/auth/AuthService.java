package com.dang.app.service.auth;

import com.dang.app.dto.auth.request.*;
import com.dang.app.dto.auth.response.*;
import com.dang.app.entity.auth.UserProfile;
import com.dang.app.repository.auth.UserProfileRepository;
import com.dang.app.utils.enums.OTPMailType;
import com.dang.app.utils.enums.AuthProvider;
import com.dang.app.utils.enums.OTPType;
import com.dang.app.utils.enums.Status;
import com.dang.app.utils.error.BusinessException;
import com.dang.app.utils.error.ErrorCode;
import com.dang.app.entity.auth.User;
import com.dang.app.utils.guard.UserGuard;
import com.dang.app.utils.guard.UserProfileGuard;
import com.dang.app.utils.mapper.AuthMapper;
import com.dang.app.utils.security.google.GoogleTokenVerifier;
import com.dang.app.utils.security.jwt.JwtUtil;
import com.dang.app.utils.security.jwt.ResetTokenUtil;
import com.dang.app.utils.validators.PasswordPolicyValidator;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");
    private record LocalLoginResolved(User user, UserProfile userProfile) {}

    private final OTPService otpService;
    private final UserService userService;
    private final UserProfileService userProfileService;
    private final TokenService tokenService;

    private final UserProfileRepository userProfileRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;
    private final ResetTokenUtil resetTokenUtil;
    private final GoogleTokenVerifier  googleTokenVerifier;

    private final AuthMapper authMapper;

    private final UserGuard userGuard;
    private final UserProfileGuard userProfileGuard;


    /*
    *  Hàm đăng kí Local : Hàm này sẽ tạo User đồng thời tạo UserProfile luôn
    * 1. Mã hóa mật khẩu
    * 2. Tạo User
    * 3. Tạo UserProfile nhưng completed = false (cần hoàn thiện profile mới cho dùng app)
    * username == phoneNumber
    */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        PasswordPolicyValidator.validate(request.getPassword());
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = userService.createUser(
                request.getUsername(),
                encodedPassword,
                null
        );

        userProfileService.createProfile(
                user,
                request.getUsername(),
                request.getEmail(),
                request.getLastName(),
                request.getFirstName()
        );

        return authMapper.toRegisterResponse(user);
    }


    /*
     Hàm đăng nhập LOcal
    * 1. Kiểm tra username
    * 2. Kiểm tra đã xóa chưa + status
    * 3. Kiểm tra mật khẩu
    * 4. Tạo token có : id, username, role
    * 5. Lấy UserProfile
    * 6. Kiểm tra profile đã bị xóa chưa
    */
    public LoginResponse login(LoginRequest request) {
        LocalLoginResolved resolved = resolveUserForLocalLogin(request.getUsername());
        User user = resolved.user();
        UserProfile userProfile = resolved.userProfile();

        userGuard.requireNotDeleted(user);
        userGuard.requireHasProvider(user, AuthProvider.LOCAL);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (userProfile == null) {
            userProfile = userProfileRepository.findByUser_Id(user.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        }

        userProfileGuard.requireNotDeleted(userProfile);

        if (user.getStatus() == Status.BANNED) {
            throw new BusinessException(ErrorCode.USER_BANNED);
        }

        if (user.getStatus() == Status.INACTIVE) {
            return authMapper.toLoginResponse(
                    null,
                    null,
                    user,
                    userProfile
            );
        }

        TokenResponse tokenResponse = tokenService.issueTokenPair(user);

        return authMapper.toLoginResponse(
                tokenResponse.getAccessToken(),
                tokenResponse.getRefreshToken(),
                user,
                userProfile
        );
    }

    private LocalLoginResolved resolveUserForLocalLogin(String identifier) {
        String normalizedIdentifier = normalize(identifier);
        if (normalizedIdentifier == null) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return userService.findOptionalByUsername(normalizedIdentifier)
                .map(user -> new LocalLoginResolved(user, null))
                .orElseGet(() -> resolveUserByEmailOrPhone(normalizedIdentifier));
    }

    private LocalLoginResolved resolveUserByEmailOrPhone(String identifier) {
        if (isEmail(identifier)) {
            return userProfileRepository.findByEmailIgnoreCaseWithUser(identifier)
                    .map(profile -> new LocalLoginResolved(profile.getUser(), profile))
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        }

        if (isPhoneNumber(identifier)) {
            return userProfileRepository.findByPhoneNumberWithUser(identifier)
                    .map(profile -> new LocalLoginResolved(profile.getUser(), profile))
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        }

        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }

    private boolean isEmail(String identifier) {
        return EMAIL_PATTERN.matcher(identifier).matches();
    }

    private boolean isPhoneNumber(String identifier) {
        return PHONE_PATTERN.matcher(identifier).matches();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public TokenResponse refreshToken(String refreshToken) {
        return tokenService.rotateRefreshToken(refreshToken);
    }

    public void logout(String refreshToken) {
        tokenService.revokeByRefreshToken(refreshToken);
    }

    public long getRefreshTokenExpirationSeconds() {
        return tokenService.getRefreshTokenExpirationSeconds();
    }

    /*
     * Hàm tạo otp + gửi mail truongfhopwj đăng kí
     *  1. Lấy profile
     *  2. Kiểm tra user
     *  3. tạo otp
     *  4. gửi mail
     * */
    public OtpVerifyResponse createAndSendOTPWhenNotLogin(
            OTPRequest  request,
            OTPType otpType,
            OTPMailType mailType
    ) {
        UserProfile profile = userProfileRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        User user = profile.getUser();
        userGuard.requireValidUserForOTP(user, otpType);

        otpService.createAndsendOTP(
                user,
                profile.getEmail(),
                otpType,
                mailType
        );

        return authMapper.toOtpSentResponse();
    }


    /*
     * Hàm tạo otp + gửi xác nhận emali trường hợp đăng nhập
     *  1. Kiểm tra user
     *  2. Lấy profile
     *  3. tạo otp
     *  4. gửi mail
     * */
    public OtpVerifyResponse createAndSendOTPWhenLogin(
            UUID userId,
            OTPType otpType,
            OTPMailType mailType) {
        User user = userService.findById(userId);
        userGuard.requireValidUserForOTP(user, otpType);

        UserProfile profile = userProfileRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        otpService.createAndsendOTP(
                user,
                profile.getEmail(),
                otpType,
                mailType
        );

        return authMapper.toOtpSentResponse();
    }


    /*
    * Hàm xác nhận otp : dùng cho cả xác nhận email và reset pasword
    *
    * */
    @Transactional
    public OtpVerifyResponse verifyOTPWhenNotLogin(
            VerifyOtpRequest request,
            OTPType otpType
    ) {
        UserProfile profile = userProfileRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        userProfileGuard.requireNotDeleted(profile);

        User user = profile.getUser();

        verifyOTPInternal(
                user,
                request.getOtp(),
                otpType
        );

        if (otpType == OTPType.EMAIL_VERIFY) {
            userService.setActiveUser(user);
        }

        String generatedResetToken = otpType == OTPType.PASSWORD_RESET
                ? resetTokenUtil.generateToken(user.getId())
                : null;

        return authMapper.toOtpVerifyResponse(otpType, generatedResetToken);

    }


    @Transactional
    public OtpVerifyResponse verifyOTPWhenLogin(
            UUID userId,
            OTPType otpType,
            VerifyOtpRequest request
    ) {
        User user = userService.findById(userId);

        verifyOTPInternal(
               user,
               request.getOtp(),
               otpType
       );

        if (otpType == OTPType.EMAIL_VERIFY) {
            userService.setActiveUser(user);
        }

        String generatedResetToken = otpType == OTPType.PASSWORD_RESET
                ? resetTokenUtil.generateToken(user.getId())
                : null;

        return authMapper.toOtpVerifyResponse(otpType, generatedResetToken);
    }


    private void verifyOTPInternal(
            User user,
            String otp,
            OTPType otpType
    ) {
        userGuard.requireValidUserForOTP(user, otpType);
        otpService.verifyOTP(user.getId(), otp, otpType);
    }


    /*
    * Hàm đăng kí bằng google
    *  1. Xác nhận token google
    *  2. Kiểm tra email lấy từ token
    *  ( 3. Nếu đã tồn tại email chuyển sang login )
    *  3. Lấy họ, tên, avtar trong token
    *  4. Tạo user mới , tạo profile
    *  5. Sinh token để đăng nhập luôn
    * Note : Khi đăng kí bằng google thì username, password = null
    *        Bỏ qua việc xác nhận email
    * */
    @Transactional
    public GoogleAuthResponse registerWithGoogle(GoogleTokenRequest request) {
        JWTClaimsSet claims = googleTokenVerifier.verify(request.getTokenId());

        String email = (String) claims.getClaim("email");
        if (email == null) {
            throw new BusinessException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }

        if (userProfileRepository.existsByEmail(email)) {
            return loginWithGoogle(email);
        }

        User user = userService.createUser(
                null,
                null,
                Set.of(AuthProvider.GOOGLE)
        );
        userService.setActiveUser(user);

        String lastName  = (String) claims.getClaim("family_name");
        String firstName = (String) claims.getClaim("given_name");
        String avatarUrl = (String) claims.getClaim("picture");

        UserProfile profile = userProfileService.createProfile(
                user,
                null,
                email,
                lastName,
                firstName
        );
        userProfileService.changeAvatar(avatarUrl, profile);

        return buildGoogleAuthResponse(user, profile, true);
    }


    /*
    * Hàm login bằng google
    *  1. Tìm user
    *  2. Nếu đăng nhập bằng gg ần đầu thì thêm AuthProvider
    *  3. Sinh token
    * */
    public GoogleAuthResponse loginWithGoogle(String email) {
        UserProfile profile = userProfileRepository
                .findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));

        User user = profile.getUser();
        user.getAuthProviders().add(AuthProvider.GOOGLE);
        return buildGoogleAuthResponse(user, profile, false);
    }

    private GoogleAuthResponse buildGoogleAuthResponse(User user, UserProfile profile, boolean isNew) {
        TokenResponse tokenResponse = tokenService.issueTokenPair(user);

        return authMapper.toGoogleAuthResponse(tokenResponse, user, profile, isNew);
    }


    /*
     * Hàm đặt lại mật khẩu
     *  1. Kiểm tra user
     *  2. Validate new password
     *  3. Sửa password
     *  4. Revoke reset token (hủy token)
     * */
    @Transactional
    public MessageResponse resetPassword(
            String resetToken,
            ResetPasswordRequest request
    ) {
        UUID userId = resetTokenUtil.validateAndExtractUserId(resetToken);

        User user = userService.findById(userId);
        userGuard.requireNotDeleted(user);

        PasswordPolicyValidator.validate(request.getNewPassword());

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );
        userService.save(user);

        resetTokenUtil.revoke(resetToken);

        return authMapper.toResetPasswordResponse();
    }



}

