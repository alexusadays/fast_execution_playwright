# Fast Playwright Execution in GitHub Actions

Optimized Playwright test execution for GitHub Actions CI/CD pipelines with sharding, automated report publishing, and secure credentials management.

## Features

- **4x Parallel Sharding** - Tests split across 4 parallel CI jobs
- **Playwright Docker Image** - Skip browser installation on every run
- **GitHub Pages Reports** - Automatically published HTML reports
- **Secure Credentials** - GitHub Secrets for sensitive data

## Live Report

View the latest test report: [https://alexusadays.github.io/fast_execution_playwright/](https://alexusadays.github.io/fast_execution_playwright/)

## Quick Start

```bash
# Install dependencies
npm install

# Run tests locally
npx playwright test

# Run tests with UI
npx playwright test --ui
```

## CI/CD Pipeline

The workflow consists of three jobs:

```
┌───────────────────────────────────────────────────┐
│                    playwright-tests               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Shard 1 │ │ Shard 2 │ │ Shard 3 │ │ Shard 4 │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└───────┼───────────┼───────────┼───────────┼───────┘
        │           │           │           │
        └───────────┴───┬───────┴───────────┘
                        ▼
              ┌─────────────────┐
              │  merge-reports  │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ publish-report  │
              │ (GitHub Pages)  │
              └─────────────────┘
```

## Performance

**Workers × Shards = Total Parallelism**

Current setup: **4 shards × 2 workers = 8 parallel test streams**

```
Without optimization (1 machine, 1 worker):
┌─────────────────────────────────────────────────────┐
│ Test1 → Test2 → Test3 → Test4 → Test5 → Test6 → ...│  ~8 min
└─────────────────────────────────────────────────────┘

With 4 shards × 2 workers:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Shard 1     │ │ Shard 2     │ │ Shard 3     │ │ Shard 4     │
│ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │
│ │Worker 1 │ │ │ │Worker 1 │ │ │ │Worker 1 │ │ │ │Worker 1 │ │
│ │Worker 2 │ │ │ │Worker 2 │ │ │ │Worker 2 │ │ │ │Worker 2 │ │
│ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
     ~1 min          ~1 min          ~1 min          ~1 min
```

| Config | Parallelism | Time |
|--------|-------------|------|
| 1 shard, 1 worker | 1 | ~8 min |
| 1 shard, 4 workers | 4 | ~2 min |
| 4 shards, 1 worker | 4 | ~2 min |
| **4 shards, 2 workers** | **8** | **~1 min** |

## Configuration

### Playwright Config Highlights

```typescript
// playwright.config.ts
{
  fullyParallel: true,           // Parallel execution within shards
  workers: process.env.CI ? 2 : undefined,  // 2 workers per shard in CI
  reporter: process.env.CI ? 'blob' : 'html',
  headless: !!process.env.CI,    // Headless in CI, headed locally
}
```

### GitHub Secrets Required

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `TEST_USERNAME` | Test account username |
| `TEST_PASSWORD` | Test account password |

### Local Setup

Create `tests/credentials.ts` (gitignored):

```typescript
export const credentials = {
    username: process.env.TEST_USERNAME || 'your-username',
    password: process.env.TEST_PASSWORD || 'your-password'
};
```

### GitHub Pages Setup

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**

## Optimization Strategies

### 1. Playwright Docker Image

```yaml
container:
  image: mcr.microsoft.com/playwright:v1.58.0-noble
```

> Match the Docker image version with your `@playwright/test` package version.

### 2. Test Sharding

```yaml
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
```

### 3. Blob Reports for Merging

Each shard uploads a blob report, then merged into a single HTML report:

```bash
npx playwright merge-reports --reporter html ./all-blob-reports
```

## Project Structure

```
├── .github/workflows/playwright.yml  # CI workflow
├── tests/
│   ├── credentials.ts                # Credentials management
│   └── sign-in*.spec.ts              # Test files
├── playwright.config.ts              # Playwright configuration
└── package.json
```

## Local Development

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/sign-in1.spec.ts

# Run with specific shard
npx playwright test --shard=1/4

# Debug mode
npx playwright test --debug

# View last report
npx playwright show-report
```

## Troubleshooting

### URL Differences (Local vs CI)

Use regex for URL assertions to handle variations:

```typescript
await expect(page).toHaveURL(/secure(\.html)?$/);
```

## Docs

- [Playwright CI Intro](https://playwright.dev/docs/ci-intro)
- [Test Sharding](https://playwright.dev/docs/test-sharding)
- [Docker](https://playwright.dev/docs/docker)
