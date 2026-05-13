# Fookbase

Monorepo cho hệ thống mạng xã hội Fookbase, gồm frontend web và 2 backend:
- Java backend: xử lý nghiệp vụ chính, auth, profile, friendship, realtime.
- C# backend: xử lý social features (post/comment/story...), read-model, và tích hợp với Java API.

## 1. Kiến trúc tổng quan

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| `frontend` | React + TypeScript + Vite | Giao diện web |
| `chat_app/backend` | Spring Boot 3 (Java 17) + MySQL + Redis | Core API (auth, user, friendship, messaging) |
| `backend/fookbase.API` | ASP.NET Core 8 + PostgreSQL + RabbitMQ | Social API (post/comment/story/report/notification) và read-model consumer |
| Hàng đợi sự kiện | RabbitMQ (CloudAMQP hoặc self-host) | Đồng bộ read-model qua event |

## 2. Cấu trúc thư mục chính

```text
.
├─ frontend/                 # React app
├─ chat_app/backend/         # Java backend (Spring Boot)
├─ backend/fookbase.API/     # C# backend
├─ backend/fookbase.API.Tests/
├─ .github/workflows/        # CI/CD
└─ docs/
```

## 3. Yêu cầu môi trường local

- Node.js 20+
- npm 10+
- Java 17
- Maven 3.9+
- .NET SDK 8.0+
- MySQL 8+ (cho Java backend)
- Redis 6+ (cho Java backend)
- PostgreSQL 14+ (cho C# backend)
- RabbitMQ (tùy chọn khi bật read-model event)

## 4. Chạy local

### 4.1. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend mặc định dùng:
- `VITE_API_BASE_URL=https://localhost:7000` (C# backend)
- `VITE_JAVA_API_BASE_URL=http://localhost:8080` (Java backend)

### 4.2. Java backend (`chat_app/backend`)

Biến môi trường tối thiểu:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`

Chạy:

```bash
mvn -B spring-boot:run -f chat_app/backend/pom.xml
```

Mặc định lắng nghe `http://localhost:8080`.

### 4.3. C# backend (`backend/fookbase.API`)

Cấu hình local nằm ở:
- `backend/fookbase.API/appsettings.Development.json`

Chạy:

```bash
dotnet run --project backend/fookbase.API/fookbase.API.csproj
```

Mặc định lắng nghe:
- `https://localhost:7000`
- `http://localhost:5000`

### 4.4. Bật luồng read-model bằng RabbitMQ (tùy chọn)

Java backend:
- `READ_MODEL_EVENTS_ENABLED=true`
- `READ_MODEL_EVENTS_EXCHANGE=fookbase.domain.events`
- `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VIRTUAL_HOST`

C# backend:
- `RabbitMqReadModel__Enabled=true`
- `RabbitMqReadModel__HostName`, `RabbitMqReadModel__Port`, `RabbitMqReadModel__VirtualHost`
- `RabbitMqReadModel__UserName`, `RabbitMqReadModel__Password`
- `RabbitMqReadModel__ExchangeName=fookbase.domain.events`
- `RabbitMqReadModel__QueueName=fookbase.read-model.csharp`

## 5. Chạy test

```bash
# C#
dotnet test backend/fookbase.slnx --configuration Release --nologo

# Java
mvn -B test -f chat_app/backend/pom.xml

# Frontend
cd frontend && npm run lint && npm run build
```

## 6. Deploy trên các môi trường

### 6.1. CI/CD (GitHub Actions)

Workflow: `.github/workflows/main-auto-test-deploy.yml`

Luồng hiện tại:
1. Push vào nhánh `main`.
2. Chạy test C#.
3. Chạy test Java.
4. Nếu pass, trigger deploy hook Render theo thứ tự:
   - Java backend trước
   - C# backend sau

Secrets cần có:
- `RENDER_DEPLOY_HOOK_JAVA`
- `RENDER_DEPLOY_HOOK_CSHARP`

### 6.2. Backend production

- Java backend: Render (Docker)
- C# backend: Render (Docker)

### 6.3. Frontend production

Frontend là static build (`npm run build`), có thể deploy trên Cloudflare Pages/Vercel/Netlify.
Repo hiện chưa có workflow tự động deploy frontend trong `.github/workflows`.

### 6.4. RabbitMQ production

- Khuyến nghị dùng dịch vụ managed (ví dụ CloudAMQP).
- Với môi trường tiết kiệm chi phí, có thể dùng gói free (phù hợp dev/test, không khuyến nghị tải cao production).

## 7. Ghi chú quan trọng

- Không commit secrets thật vào Git.
- Nếu lộ credentials, cần rotate ngay (DB, JWT, RabbitMQ, Cloudinary...).
- Khi lỗi kết nối C# <-> Java, kiểm tra lại `JavaApi:BaseUrl` trên C#.
- Khi bật RabbitMQ nhưng không thấy đồng bộ, kiểm tra:
  - Java đã bật `READ_MODEL_EVENTS_ENABLED=true`
  - C# đã bật `RabbitMqReadModel__Enabled=true`
  - Cùng exchange `fookbase.domain.events`
