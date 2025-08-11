# GitHub Actions Secrets Configuration

## Required Secrets for CI/CD

Configure these secrets in your repository settings (Settings > Secrets and variables > Actions):

### Database Secrets
- `DATABASE_URL`: PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/database`
  - For CI: Use the test database URL

### Redis Secrets  
- `REDIS_URL`: Redis connection string
  - Example: `redis://localhost:6379`
  - For CI: Use the test Redis URL

### Application Secrets
- `JWT_SECRET`: Secret key for JWT tokens
  - Generate with: `openssl rand -base64 32`
  
- `FRONTEND_ORIGIN`: Frontend URL for CORS
  - Development: `http://localhost:5173`
  - Production: Your production frontend URL

### Object Storage (MinIO) - Optional
- `MINIO_ENDPOINT`: MinIO server endpoint
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key

### Deployment Secrets (if deploying via GitHub Actions)
- `DEPLOY_HOST`: Server hostname/IP
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key for deployment
- `DOCKER_REGISTRY_URL`: Docker registry URL (if using)
- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password

## Environment-specific Configuration

### Development/Test
These are already configured in the CI workflow for testing purposes.

### Production
Add production-specific secrets with `PROD_` prefix:
- `PROD_DATABASE_URL`
- `PROD_REDIS_URL`
- `PROD_FRONTEND_ORIGIN`

## How to Add Secrets

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add the secret name and value
6. Click **Add secret**

## Security Best Practices

1. Never commit secrets to the repository
2. Use strong, randomly generated values
3. Rotate secrets regularly
4. Use different secrets for each environment
5. Limit secret access to necessary workflows only
