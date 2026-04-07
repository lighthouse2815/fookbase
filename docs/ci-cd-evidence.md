# Bằng Chứng CI/CD Và Triển Khai Azure

Repository này đã được cấu hình pipeline GitHub Actions thực tế cho các bước build, test, publish và triển khai lên Azure:

- File workflow: `.github/workflows/azure-cicd.yml`
- Trigger: `push`/`pull_request` vào `main`, và `workflow_dispatch`

## Phạm Vi Pipeline

1. Frontend CI
- Cài đặt dependencies bằng `npm ci`
- Build frontend bằng `npm run build`
- Xuất artifact frontend với tên `frontend-dist`

2. Backend CI
- Restore/build ASP.NET Core API ở cấu hình `Release`
- Chạy test xUnit + Moq từ `backend/fookbase.API.Tests`
- Xuất artifact backend với tên `backend-publish`

3. CD Lên Azure
- Triển khai artifact backend lên Azure App Service bằng `azure/webapps-deploy`
- Triển khai artifact frontend lên Azure Blob Static Website bằng `az storage blob upload-batch`

## GitHub Secrets Bắt Buộc

- `AZURE_CREDENTIALS`
- `AZURE_BACKEND_WEBAPP_NAME`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `VITE_API_BASE_URL`
- `VITE_JAVA_API_BASE_URL`

## Checklist Bằng Chứng Cho Báo Cáo

1. Ảnh chụp workflow chạy thành công (tất cả job xanh) trên GitHub Actions.
2. Ảnh chụp lịch sử deploy backend trong Azure App Service Deployment Center.
3. Ảnh chụp container website tĩnh `$web` trong Azure Storage Account.
4. URL public của frontend và URL public của backend API.
5. Link workflow gần nhất chạy thành công.
