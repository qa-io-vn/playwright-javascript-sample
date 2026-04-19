# 27 — Docker & Containerization

[← Previous: CI/CD](./26-cicd-github-actions.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Allure Reporting →](./28-allure-reporting.md)

---

## What You Will Learn

- How to run Playwright tests in Docker containers
- How to build a custom Docker image for your framework
- Why containerization guarantees consistency
- Docker Compose for multi-service test environments

---

## Why Docker for Testing?

| Problem | Docker Solution |
|---|---|
| "Works on my machine" | Same OS, same fonts, same browsers everywhere |
| Screenshot diffs between Mac/Linux | Container = always Linux = consistent screenshots |
| Missing system dependencies | All deps baked into the image |
| Inconsistent CI environments | Exact same image locally and in CI |

---

## Playwright's Official Docker Image

Playwright provides ready-to-use Docker images:

```bash
# Run tests using the official image
docker run --rm -it \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/playwright:v1.59.1-noble \
  bash -c "npm ci && npx playwright test"
```

### Available images

| Image | Size | Description |
|---|---|---|
| `mcr.microsoft.com/playwright:v1.59.1-noble` | ~2GB | Ubuntu 24.04 + all browsers |
| `mcr.microsoft.com/playwright:v1.59.1-noble-amd64` | ~2GB | AMD64 specific |
| `mcr.microsoft.com/playwright:v1.59.1-noble-arm64` | ~2GB | ARM64 (Apple Silicon) |

Always match the image tag version to your `@playwright/test` version in `package.json`.

---

## Custom Dockerfile

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project
COPY . .

# Run tests by default
CMD ["npx", "playwright", "test"]
```

### Build and run

```bash
# Build the image
docker build -t my-playwright-tests .

# Run all tests
docker run --rm my-playwright-tests

# Run specific tests
docker run --rm my-playwright-tests npx playwright test --grep @smoke

# Run with environment variables
docker run --rm \
  -e BASE_URL=https://staging.example.com \
  -e PASSWORD=secret_sauce \
  my-playwright-tests

# Mount volume for reports
docker run --rm \
  -v $(pwd)/test-results:/app/test-results \
  -v $(pwd)/playwright-report:/app/playwright-report \
  my-playwright-tests
```

---

## Docker Compose

For testing against local services:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: my-web-app:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/testdb

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: testdb

  tests:
    build: .
    depends_on:
      - app
    environment:
      - BASE_URL=http://app:3000
      - PASSWORD=secret_sauce
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    command: >
      bash -c "
        npx wait-on http://app:3000 --timeout 60000 &&
        npx playwright test
      "
```

```bash
# Run everything
docker compose up --abort-on-container-exit --exit-code-from tests

# Clean up
docker compose down -v
```

---

## .dockerignore

```
node_modules
test-results
playwright-report
allure-results
allure-report
blob-report
.git
.env
```

---

## GitHub Actions with Docker

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.59.1-noble
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test
        env:
          HOME: /root
          PASSWORD: ${{ secrets.SAUCEDEMO_PASSWORD }}
```

---

## Tips

1. **Always pin the Playwright image version** to match your `package.json` version
2. **Use `.dockerignore`** to keep the image small
3. **Mount volumes** for test results to access reports from the host
4. **Use `--rm`** flag to auto-remove containers after runs
5. **For Apple Silicon**: use the `arm64` image variant or build with `--platform linux/amd64`

---

## Practice Exercises

1. Create a `Dockerfile` using the Playwright official image
2. Build and run tests inside Docker
3. Mount the `test-results` volume and examine screenshots/traces from the host
4. Create a `docker-compose.yml` for running tests against a local app
5. Use the Docker container in a GitHub Actions workflow

---

[Next: Allure Reporting →](./28-allure-reporting.md)
