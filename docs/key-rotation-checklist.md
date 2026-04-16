# Danh sách kiểm tra xoay vòng khóa bí mật

Sử dụng danh sách này mỗi khi xoay vòng secret hoặc sau bất kỳ sự cố rò rỉ nào.

## 1. Chuẩn bị

1. Kiểm kê các secret bị ảnh hưởng từ `docs/secrets-inventory.md`.
2. Chọn thời gian xoay vòng và người phụ trách rollback.
3. Xác nhận dashboard giám sát và các đầu mối liên hệ khi có cảnh báo.

## 2. Tạo secret mới

1. Tạo các giá trị ngẫu nhiên mạnh (>= 32 ký tự đối với secret JWT/reset đối xứng).
2. Lưu các giá trị mới vào Azure Key Vault (hoặc công cụ quản lý secret mục tiêu) dưới dạng các phiên bản mới.
3. Chưa vô hiệu hóa các phiên bản cũ ở bước này.

## 3. Triển khai cấu hình

1. Cập nhật thiết lập App Service / biến triển khai để tham chiếu đến các phiên bản mới.
2. Cập nhật secret của GitHub Actions nếu CI cần dùng.
3. Khởi động lại / triển khai lại backend Java và API C#.

## 4. Xác thực

1. Chức năng đăng nhập và các endpoint được bảo vệ bằng token vẫn hoạt động.
2. Phân quyền quản trị vẫn hoạt động.
3. Luồng OTP / đặt lại mật khẩu vẫn hoạt động.
4. Chức năng ký để upload media vẫn hoạt động (Cloudinary).
5. Các workflow CI chạy thành công.

## 5. Thu hồi secret cũ

1. Vô hiệu hóa các phiên bản secret cũ sau khi đã qua khoảng thời gian xác thực ổn định.
2. Buộc đăng xuất / kết thúc phiên nếu việc xoay vòng liên quan đến khóa ký xác thực.
3. Ghi lại thời gian hoàn tất và người phụ trách.

## 6. Ghi nhận sau khi xoay vòng

1. Cập nhật người phụ trách secret và ngày xoay vòng vào runbook nội bộ.
2. Lập hồ sơ sự cố nếu việc xoay vòng được thực hiện do rò rỉ.





# Key Rotation Checklist

Use this checklist whenever rotating secrets or after any leak.

## 1. Prepare

1. Inventory impacted secrets from `docs/secrets-inventory.md`.
2. Pick rotation window and rollback owner.
3. Confirm monitoring dashboards and alert contacts.

## 2. Generate new secrets

1. Generate strong random values (>= 32 chars for symmetric JWT/reset secrets).
2. Store new values in Azure Key Vault (or target secret manager) as new versions.
3. Do not disable old versions yet.

## 3. Roll out configuration

1. Update App Service settings / deployment variables to reference new versions.
2. Update GitHub Actions secrets if CI needs them.
3. Restart/redeploy Java backend and C# API.

## 4. Validate

1. Login and token-protected endpoints work.
2. Admin authorization still works.
3. OTP/reset password flow works.
4. Media upload signing works (Cloudinary).
5. CI workflows pass.

## 5. Revoke old secrets

1. Disable old secret versions after stable validation window.
2. Force logout/sessions if rotation includes auth signing keys.
3. Record completion time and owner.

## 6. Post-rotation record

1. Update secret owner and rotated-at date in your internal runbook.
2. File incident record if rotation was leak-driven.
