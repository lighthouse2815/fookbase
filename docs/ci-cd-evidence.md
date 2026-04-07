# CI/CD and Azure Deployment Evidence

This repository is configured with a real GitHub Actions pipeline for build, test, publish, and Azure deployment:

- Workflow file: `.github/workflows/azure-cicd.yml`
- Trigger: `push`/`pull_request` to `main`, and `workflow_dispatch`

## Pipeline Coverage

1. Frontend CI
- Installs dependencies with `npm ci`
- Builds frontend with `npm run build`
- Publishes build output as artifact `frontend-dist`

2. Backend CI
- Restores/builds ASP.NET Core API in `Release`
- Runs xUnit + Moq tests from `backend/fookbase.API.Tests`
- Publishes backend artifact `backend-publish`

3. CD to Azure
- Deploy backend artifact to Azure App Service via `azure/webapps-deploy`
- Deploy frontend artifact to Azure Blob Static Website via `az storage blob upload-batch`

## Required GitHub Secrets

- `AZURE_CREDENTIALS`
- `AZURE_BACKEND_WEBAPP_NAME`
- `AZURE_STORAGE_ACCOUNT`
- `AZURE_STORAGE_KEY`
- `VITE_API_BASE_URL`
- `VITE_JAVA_API_BASE_URL`

## Evidence Checklist For Report

1. Screenshot workflow run success (all jobs green) in GitHub Actions.
2. Screenshot backend deployment history in Azure App Service Deployment Center.
3. Screenshot static website container `$web` in Azure Storage Account.
4. Public frontend URL and backend API URL.
5. Latest successful workflow run link.
