# Fookbase

Hướng dẫn chạy local chi tiết cho toàn bộ monorepo, gồm:
1. Web frontend (`frontend`)
2. Java backend (`chat_app/backend`)
3. C# backend (`backend/fookbase.API`)
4. Android mobile app (`chat_app/frontend`)

## 1. Kiến trúc và luồng phụ thuộc

| Thành phần | Công nghệ | Vai trò | Phụ thuộc |
|---|---|---|---|
| `frontend` | React + TypeScript + Vite | Web app | Gọi cả C# API và Java API |
| `chat_app/backend` | Spring Boot 3 (Java 17) + MySQL + Redis | Auth, profile, friendship, messaging, realtime | MySQL, Redis, tùy chọn RabbitMQ |
| `backend/fookbase.API` | ASP.NET Core 8 + PostgreSQL | Social features (post/comment/story/report...), tích hợp Java API | PostgreSQL, Java API, tùy chọn RabbitMQ |
| `chat_app/frontend` | Android native (Java/XML) | Mobile chat app | Java API (`chat_app/backend`) |

## 2. Cần cài gì trước khi chạy local

1. Git
2. Node.js 20+ và npm 10+
3. Java JDK 17
4. Maven 3.9+
5. .NET SDK 8.0+
6. Android Studio (nếu chạy mobile)
7. Android SDK Platform 36 + Android Emulator (hoặc máy Android thật)
8. Docker Desktop (khuyến nghị mạnh để chạy MySQL/PostgreSQL/Redis/RabbitMQ nhanh)

## 3. Port local mặc định

| Service | Port | URL |
|---|---:|---|
| Web frontend | 5173 | `http://localhost:5173` |
| Java backend | 8080 | `http://localhost:8080` |
| C# backend | 7000 / 5000 | `https://localhost:7000`, `http://localhost:5000` |
| PostgreSQL | 5432 | `localhost:5432` |
| MySQL | 3306 | `localhost:3306` |
| Redis | 6379 | `localhost:6379` |
| RabbitMQ AMQP | 5672 | `localhost:5672` |
| RabbitMQ UI | 15672 | `http://localhost:15672` |

## 4. Dựng hạ tầng local (DB/Redis/RabbitMQ)

### 4.1. Cách nhanh nhất: dùng Docker

Chạy lần lượt:

```bash
docker network create fookbase-net
docker run -d --name fookbase-mysql --network fookbase-net -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=chat_app mysql:8.0
docker run -d --name fookbase-postgres --network fookbase-net -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fookbase_dev postgres:15
docker run -d --name fookbase-redis --network fookbase-net -p 6379:6379 redis:7
docker run -d --name fookbase-rabbit --network fookbase-net -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=guest -e RABBITMQ_DEFAULT_PASS=guest rabbitmq:3-management
```

Kiểm tra:

```bash
docker ps
```

### 4.2. Nếu cài native thay Docker

1. Tạo MySQL database: `chat_app`
2. Tạo PostgreSQL database: `fookbase_dev`
3. Chạy Redis tại `localhost:6379`
4. Chạy RabbitMQ tại `localhost:5672` (tùy chọn nếu bật read-model events)

## 5. Biến môi trường cần cấu hình

## 5.1. Web frontend (`frontend/.env`)

Tạo `frontend/.env` từ `frontend/.env.example`:

```env
VITE_API_BASE_URL=https://localhost:7000
VITE_JAVA_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Giải thích:
1. `VITE_API_BASE_URL`: C# backend
2. `VITE_JAVA_API_BASE_URL`: Java backend
3. `VITE_GOOGLE_WEB_CLIENT_ID`: cần nếu dùng đăng nhập Google

## 5.2. Java backend (`chat_app/backend`)

File mẫu đã có: `chat_app/backend/.env.example`.

Biến tối thiểu để chạy local:

| Biến | Bắt buộc | Gợi ý local |
|---|---|---|
| `DB_URL` | Có | `jdbc:mysql://localhost:3306/chat_app?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh` |
| `DB_USERNAME` | Có | `root` |
| `DB_PASSWORD` | Có | để trống nếu dùng Docker command ở trên |
| `REDIS_HOST` | Có | `localhost` |
| `REDIS_PORT` | Có | `6379` |
| `JWT_SIGNER_KEY` | Nên có | chuỗi bí mật dài 32+ ký tự |
| `RESET_TOKEN_SECRET` | Nên có | chuỗi bí mật dài 32+ ký tự |
| `GOOGLE_OAUTH_CLIENT_ID` | Nếu dùng Google login | web client id từ Google Cloud |

Biến tùy chọn:
1. Email/OTP: `EMAIL_PROVIDER`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `RESEND_API_KEY`, `RESEND_FROM`
2. Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_UPLOAD_FOLDER`
3. RabbitMQ: `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VIRTUAL_HOST`
4. Read model events: `READ_MODEL_EVENTS_ENABLED`, `READ_MODEL_EVENTS_EXCHANGE`

Lưu ý quan trọng:
1. Chạy `mvn spring-boot:run` không tự load file `.env` theo mặc định shell.
2. Nếu cần set env nhanh trong PowerShell trước khi chạy:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/chat_app?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh"
$env:DB_USERNAME="root"
$env:DB_PASSWORD=""
$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
```

## 5.3. C# backend (`backend/fookbase.API`)

Cấu hình local mặc định đã nằm trong `backend/fookbase.API/appsettings.Development.json`.

Biến tối thiểu nếu muốn override bằng ENV:

| Biến | Bắt buộc | Gợi ý local |
|---|---|---|
| `ConnectionStrings__AppDbConnection` | Có | `Host=localhost;Port=5432;Database=fookbase_dev;Username=postgres;Password=postgres;Include Error Detail=true` |
| `JavaApi__BaseUrl` | Có | `http://localhost:8080/api` |
| `JWT_SECRET_KEY` | Nên có | chuỗi bí mật dài 32+ ký tự |

Biến tùy chọn:
1. `Security__EnableHttpsRedirection`
2. `Database__MigrateOnStartup`, `Database__MigrationRetryCount`, `Database__MigrationRetryDelaySeconds`, `Database__FailFastOnMigrationError`
3. `Cloudinary__CloudName`, `Cloudinary__ApiKey`, `Cloudinary__ApiSecret`, `Cloudinary__UploadPreset`, `Cloudinary__UploadFolder`
4. `RabbitMqReadModel__Enabled`, `RabbitMqReadModel__HostName`, `RabbitMqReadModel__Port`, `RabbitMqReadModel__VirtualHost`, `RabbitMqReadModel__UserName`, `RabbitMqReadModel__Password`, `RabbitMqReadModel__ExchangeName`, `RabbitMqReadModel__QueueName`

## 5.4. Android mobile app (`chat_app/frontend`)

Mobile không dùng `.env`, mà dùng Gradle config.

Bắt buộc:
1. `GOOGLE_WEB_CLIENT_ID` trong `chat_app/frontend/gradle.properties`
2. Kiểm tra `org.gradle.java.home` trong `chat_app/frontend/gradle.properties` đang trỏ đúng JDK 17 trên máy bạn

Ví dụ:

```properties
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Về API base URL:
1. Hiện tại `chat_app/frontend/app/build.gradle.kts` đang set `BASE_URL` về endpoint remote.
2. Nếu muốn chạy local Java backend, đổi `BASE_URL` trong flavor `dev` sang:
3. Android Emulator: `http://10.0.2.2:8080/`
4. Máy thật cùng Wi-Fi: `http://<LAN_IP_MAY_CHAY_BACKEND>:8080/`

Nếu dùng HTTP local cho Android:
1. Đặt `manifestPlaceholders["usesCleartextTraffic"] = "true"` ở flavor local/dev.

Lưu ý:
1. `BuildConfig.BASE_URL` phải có dấu `/` ở cuối.

## 6. Thứ tự chạy local chuẩn

### Bước 1: chạy hạ tầng

1. MySQL + PostgreSQL + Redis
2. RabbitMQ chỉ cần khi bật read-model events

### Bước 2: chạy Java backend

```bash
mvn -B spring-boot:run -f chat_app/backend/pom.xml
```

Sau khi chạy: `http://localhost:8080`

### Bước 3: chạy C# backend

Trust HTTPS cert (chạy 1 lần trên máy dev):

```bash
dotnet dev-certs https --trust
```

Chạy API:

```bash
dotnet run --project backend/fookbase.API/fookbase.API.csproj
```

Sau khi chạy:
1. `https://localhost:7000`
2. `http://localhost:5000`
3. Swagger: `https://localhost:7000/swagger`

### Bước 4: chạy web frontend

```bash
cd frontend
npm install
npm run dev
```

Mở: `http://localhost:5173`

### Bước 5: chạy mobile Android

Cách Android Studio:
1. Mở project `chat_app/frontend`
2. Sync Gradle
3. Chọn build variant `devDebug`
4. Run lên emulator hoặc máy thật

Cách CLI:

```bash
cd chat_app/frontend
./gradlew assembleDevDebug
./gradlew installDevDebug
```

Nếu dùng Windows PowerShell/CMD, thay bằng:

```powershell
cd chat_app/frontend
.\gradlew.bat assembleDevDebug
.\gradlew.bat installDevDebug
```

## 7. Bật RabbitMQ read-model (tùy chọn)

Mặc định local đang tắt, chạy cơ bản không cần RabbitMQ.

Nếu muốn bật:

1. Java backend:
```env
READ_MODEL_EVENTS_ENABLED=true
READ_MODEL_EVENTS_EXCHANGE=fookbase.domain.events
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VIRTUAL_HOST=/
```

2. C# backend:
```env
RabbitMqReadModel__Enabled=true
RabbitMqReadModel__HostName=localhost
RabbitMqReadModel__Port=5672
RabbitMqReadModel__VirtualHost=/
RabbitMqReadModel__UserName=guest
RabbitMqReadModel__Password=guest
RabbitMqReadModel__ExchangeName=fookbase.domain.events
RabbitMqReadModel__QueueName=fookbase.read-model.csharp
```

## 8. Kiểm tra nhanh sau khi chạy

1. Java backend chạy: truy cập `http://localhost:8080`
2. C# backend chạy: truy cập `https://localhost:7000/swagger`
3. Web mở được: `http://localhost:5173`
4. RabbitMQ UI (nếu bật): `http://localhost:15672` (`guest` / `guest`)

## 9. Lỗi thường gặp

1. Lỗi CORS từ web
Giải pháp: kiểm tra `VITE_API_BASE_URL`, `VITE_JAVA_API_BASE_URL`, và cấu hình `Cors:AllowedOrigins` của C# + `app.cors.allowed-origin-patterns` của Java.

2. Web gọi HTTPS C# bị lỗi cert
Giải pháp: chạy `dotnet dev-certs https --trust`.

3. Android không gọi được local API
Giải pháp:
1. Emulator dùng `10.0.2.2`, không dùng `localhost`
2. Nếu dùng HTTP, bật `usesCleartextTraffic=true`

4. Đăng nhập Google lỗi
Giải pháp:
1. Đồng bộ cùng một web client id cho web frontend, Java backend, mobile
2. Kiểm tra OAuth client đã bật đúng domain/package/signature theo môi trường test

5. Cổng bị chiếm
Giải pháp: đổi port hoặc tắt process đang chiếm `3306/5432/6379/8080/7000/5000/5173`.

## 10. Chạy test

```bash
# C#
dotnet test backend/fookbase.slnx --configuration Release --nologo

# Java
mvn -B test -f chat_app/backend/pom.xml

# Web
cd frontend && npm run lint && npm run build

# Mobile (unit test)
cd chat_app/frontend && ./gradlew test
# Windows: cd chat_app/frontend && .\\gradlew.bat test
```

## 11. Bảo mật

1. Không commit file chứa secrets thật (`.env`, API keys, DB password)
2. Nếu lộ secret, rotate ngay
3. `env.txt` chỉ dùng nội bộ, không đưa public
