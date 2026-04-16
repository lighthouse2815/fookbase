# Danh mục secret

Dự án này không được lưu trữ secret thật trong git. Hãy sử dụng Azure Key Vault / App Service settings (môi trường production) và các kho lưu secret cục bộ cho môi trường phát triển.

## Chính sách lưu trữ

1. Production:  
   Sử dụng tham chiếu Azure Key Vault trong App Service settings.
2. Development:  
   Sử dụng `dotnet user-secrets` cho C# và file `.env` cục bộ cho Java/frontend.
3. CI/CD:  
   Sử dụng secret được mã hóa của GitHub Actions.

## Bảng ánh xạ secret

| Secret | Dịch vụ | Nơi sử dụng | Khóa cục bộ |
|---|---|---|---|
| Khóa ký JWT (dùng chung) | Backend Java + API C# | Java `jwt.signer-key`, C# `Jwt:SecretKey` (hoặc `JWT_SECRET_KEY`) | `JWT_SIGNER_KEY`, `JWT_SECRET_KEY` |
| Chuỗi kết nối SQL Server | API C# | `ConnectionStrings:AppDbConnection` | `ConnectionStrings__AppDbConnection` |
| Thông tin đăng nhập MySQL | Backend Java | `spring.datasource.*` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| Host/port Redis | Backend Java | `spring.redis.*` | `REDIS_HOST`, `REDIS_PORT` |
| Thông tin đăng nhập SMTP | Backend Java | `spring.mail.username`, `spring.mail.password` | `MAIL_USERNAME`, `MAIL_PASSWORD` |
| Secret của reset token | Backend Java | `auth.reset-token.secret` | `RESET_TOKEN_SECRET` |
| Thông tin xác thực Cloudinary | Backend Java + API C# | `cloudinary.*`, `Cloudinary:*` | `CLOUDINARY_*`, `Cloudinary__*` |
| Client ID Google OAuth | Backend Java | `google.oauth.client-id` | `GOOGLE_OAUTH_CLIENT_ID` |
| Thông tin xác thực triển khai Azure | GitHub Actions | `.github/workflows/*.yml` | `AZURE_CREDENTIALS`, cùng các tên app liên quan |

## Các kiểm soát tối thiểu

1. Không để giá trị secret trong `appsettings*.json`, `application.yml` hoặc mã nguồn.
2. Xoay vòng mọi secret sau bất kỳ nghi ngờ rò rỉ nào.
3. Giới hạn quyền đọc theo vai trò (nguyên tắc đặc quyền tối thiểu).
4. Bật audit log cho các lần đọc/cập nhật secret.







# Secrets Inventory

This project must not store real secrets in git. Use Azure Key Vault / App Service settings (production) and local secret stores for development.

## Storage policy

1. Production:
   Use Azure Key Vault references in App Service settings.
2. Development:
   Use `dotnet user-secrets` for C# and local `.env` files for Java/frontend.
3. CI/CD:
   Use GitHub Actions encrypted secrets.

## Secret map

| Secret | Service | Where consumed | Local key |
|---|---|---|---|
| JWT signing key (shared) | Java backend + C# API | Java `jwt.signer-key`, C# `Jwt:SecretKey` (or `JWT_SECRET_KEY`) | `JWT_SIGNER_KEY`, `JWT_SECRET_KEY` |
| SQL Server connection string | C# API | `ConnectionStrings:AppDbConnection` | `ConnectionStrings__AppDbConnection` |
| MySQL credentials | Java backend | `spring.datasource.*` | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| Redis host/port | Java backend | `spring.redis.*` | `REDIS_HOST`, `REDIS_PORT` |
| SMTP credentials | Java backend | `spring.mail.username`, `spring.mail.password` | `MAIL_USERNAME`, `MAIL_PASSWORD` |
| Reset token secret | Java backend | `auth.reset-token.secret` | `RESET_TOKEN_SECRET` |
| Cloudinary credentials | Java backend + C# API | `cloudinary.*`, `Cloudinary:*` | `CLOUDINARY_*`, `Cloudinary__*` |
| Google OAuth client ID | Java backend | `google.oauth.client-id` | `GOOGLE_OAUTH_CLIENT_ID` |
| Azure deploy credentials | GitHub Actions | `.github/workflows/*.yml` | `AZURE_CREDENTIALS`, related app names |

## Minimum controls

1. No secret values in `appsettings*.json`, `application.yml`, or source code.
2. Rotate every secret after any suspected leak.
3. Restrict read access by role (least privilege).
4. Enable audit logs for secret reads/updates.
