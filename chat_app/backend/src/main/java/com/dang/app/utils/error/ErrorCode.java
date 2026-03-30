package com.dang.app.utils.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Auth
    INVALID_CREDENTIALS(401, "Tên đăng nhập hoặc mật khẩu không đúng"),
    USER_BANNED(403, "Tài khoản đã bị cấm"),
    USER_INACTIVE(403, "Tài khoản chưa được kích hoạt"),
    NO_PERMISSION(403, "Bạn không có quyền thực hiện hành động này"),
    USER_DELETED(410, "Tài khoản không tồn tại hoặc đã bị xoá"),
    AUTH_PROVIDER_NOT_ALLOWED(403, "Tài khoản không hỗ trợ phương thức đăng nhập này"),


    // UserProfile
    PROFILE_NOT_FOUND(404, "Profile không tồn tại"),
    USERNAME_EXISTS(409, "Tên đăng nhập đã tồn tại"),
    EMAIL_EXISTS(409, "Email đã tồn tại"),
    PHONENUMBER_EXISTS(409, "Số điện thoại đã tồn tại"),
    PROFILE_ALREADY_COMPLETED(409, "Profile đã đầy đủ rồi"),
    PROFILE_DELETED(410, "Profile không tồn tại hoặc đã bị xoá"),
    PHONENUMBER_NOT_EXISTS(404, "Số điện thoại không tồn tại"),

    // User
    USERNAME_NOT_FOUND(404, "Tên đăng nhập không tồn tại"),
    USER_NOT_FOUND(404, "user không tồn tại"),

    // Conversation
    INVALID_MEMBER_COUNT(400, "Conversation phải có ít nhất 2 member"),
    CREATOR_NOT_IN_MEMBER(400, "Creator phải nằm trong danh sách member"),
    UNAUTHENTICATED(400, "Creator phải nằm trong danh sách member"),
    PRIVATE_CONVERSATION_HAS_NAME(400,"Chat 1-1 không được có tên"),
    CONVERSATION_NOT_FOUND(404,"Conversation không tồn tại"),
    MEMBER_NOT_FOUND(404, "Có thành viên không tồn tại"),

    // Message
    MESSAGE_EMPTY(400, "Message content must not be empty"),
    SENDER_NOT_IN_CONVERSATION(403,"Sender không thuộc cuộc trò chuyện "),
    INVALID_CURSOR(400, "Cursor không hợp lệ"),

    // friendship
    INVALID_FRIEND_REQUEST_STATUS(400, "Lời mời kết bạn không còn hiệu lực"),
    CANNOT_BLOCK_SELF(400, "Bạn không thể chặn chính mình"),
    CANNOT_FRIEND_SELF(400,"Không được tự kết bạn với chính mình"),
    INVALID_FRIENDSHIP_STATUS(400, "Không thể huỷ kết bạn ở trạng thái hiện tại"),
    USER_BLOCKED(403,"Bạn không thể kết bạn với người này"),
    FRIEND_REQUEST_NOT_FOUND(404, "Lời mời kết bạn không tồn tại"),
    FRIENDSHIP_NOT_FOUND(404, "Quan hệ bạn bè không tồn tại"),
    ALREADY_FRIENDS(409,"Cả hai đã là bạn rồi"),
    FRIEND_REQUEST_ALREADY_SENT(409,"Bạn đã gửi lời mời kết bạn trước đó"),
    FRIEND_REQUEST_ALREADY_RECEIVED(409,"Người này đã gửi lời mời kết bạn cho bạn"),

    // Contact
    CONTACT_ALREADY_EXISTS(409, "Contact đã tồn tại"),

    // OTP
    OTP_TOO_FREQUENT(429, "Vui lòng chờ 60 giây trước khi gửi lại mã OTP"),
    OTP_EXPIRED(400, "OTP đã hết hạn"),
    OTP_ALREADY_USED(400, "OTP đã được sử dụng"),
    INVALID_OTP(400, "OTP không hợp lệ hoặc đã hết hạn"),

    // Reset Password token
    INVALID_RESET_TOKEN(401, "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"),

    // Refresh token
    INVALID_REFRESH_TOKEN(401, "Refresh token không hợp lệ"),
    REFRESH_TOKEN_EXPIRED(401, "Refresh token đã hết hạn"),
    REFRESH_TOKEN_REUSED(401, "Refresh token bị khóa do phát hiện tái sử dụng"),

    // google
    INVALID_GOOGLE_TOKEN(401, "Token Google không hợp lệ hoặc đã hết hạn"),
    INVALID_GOOGLE_SIGNATURE(401, "Không thể xác minh chữ ký token Google"),
    INVALID_GOOGLE_ISSUER(401, "Token không được phát hành bởi Google"),
    INVALID_GOOGLE_AUDIENCE(401, "Token Google không dành cho ứng dụng này"),
    GOOGLE_TOKEN_EXPIRED(401, "Phiên đăng nhập Google đã hết hạn, vui lòng đăng nhập lại"),

    // validate
    PASSWORD_TOO_SHORT(400, "Mật khẩu phải có ít nhất 8 ký tự"),
    PASSWORD_NO_UPPERCASE(400, "Mật khẩu phải chứa ít nhất 1 chữ in hoa"),
    PASSWORD_NO_NUMBER(400, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    PASSWORD_COMPROMISED(400, "Mật khẩu này đã bị lộ. Vui lòng đổi mật khẩu khác"),
    INVALID_PHONE(400, "Số điện thoại không hợp lệ"),

    // Attachment
    FILE_EMPTY(400, "File không được để trống"),
    INVALID_FILE_URL(400, "URL file không hợp lệ"),
    INVALID_FILE_NAME(400, "Tên file không hợp lệ"),
    FILE_TOO_LARGE(413, "File vượt quá dung lượng cho phép"),
    FILE_TYPE_NOT_ALLOWED(415, "Loại file không được phép upload"),
    FILE_TYPE_MISMATCH(400, "Loại file không khớp với định dạng thực tế"),
    FILE_VALIDATION_FAILED(400, "Xác thực file thất bại"),
    TOO_MANY_ATTACHMENTS(400, "Số lượng file vượt quá giới hạn cho phép"),
    FILE_UPLOAD_FAILED(500, "Upload file thất bại"),
    FILE_NOT_FOUND(404, "Không tìm thấy file"),
    FILE_ACCESS_DENIED(403, "Bạn không có quyền truy cập file");





    private final int status;
    private final String message;
}
