# 🧪 TESTING STRATEGY - VieAgent.vn v2

**Mục tiêu**: Đảm bảo code quality khi vibe-coding với AI

---

## 📋 MỤC LỤC

1. [Testing Levels](#1-testing-levels)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [E2E Tests](#4-e2e-tests)
5. [Test Coverage Goals](#5-test-coverage-goals)
6. [Testing Tools](#6-testing-tools)
7. [CI/CD Integration](#7-cicd-integration)

---

## 1. TESTING LEVELS

```
┌─────────────────────────────────────────────────────────────────┐
│                        TESTING PYRAMID                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ▲ E2E Tests                             │
│                        ╱ ╲ (Playwright)                         │
│                       ╱   ╲ 10% coverage                        │
│                      ╱     ╲                                     │
│                     ╱ Integration╲                               │
│                    ╱  Tests (API) ╲                              │
│                   ╱    30% coverage╲                             │
│                  ╱                   ╲                           │
│                 ╱     Unit Tests      ╲                          │
│                ╱     (Vitest/Jest)     ╲                         │
│               ╱───────60% coverage──────╲                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. UNIT TESTS

### 2.1 Folder Structure
```
src/
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
├── components/
│   ├── agent/
│   │   ├── AgentCard.tsx
│   │   └── AgentCard.test.tsx    # Co-located
└── lib/workflow/
    ├── executors/
    │   ├── gmail.ts
    │   └── __tests__/
    │       └── gmail.test.ts
```

### 2.2 Utils Tests Template
```typescript
// lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice, toCamelCase, toSnakeCase } from '../utils';

describe('formatPrice', () => {
  it('formats USD correctly', () => {
    expect(formatPrice(1000, 'USD')).toBe('$10.00');
  });

  it('formats VND correctly', () => {
    expect(formatPrice(100000, 'VND')).toBe('₫100,000');
  });

  it('handles zero', () => {
    expect(formatPrice(0, 'USD')).toBe('$0.00');
  });
});

describe('toCamelCase', () => {
  it('converts snake_case to camelCase', () => {
    expect(toCamelCase({ user_id: 1, created_at: 'now' }))
      .toEqual({ userId: 1, createdAt: 'now' });
  });
});
```

### 2.3 Executor Tests Template
```typescript
// lib/workflow/executors/__tests__/gmail.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gmailExecutor } from '../gmail';

// Mock fetch
globalThis.fetch = vi.fn();

describe('gmailExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('send action', () => {
    it('sends email successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-123', threadId: 'thread-456' }),
      });

      const result = await gmailExecutor.execute(
        {
          action: 'send',
          to: 'test@example.com',
          subject: 'Hello',
          body: 'Test body',
        },
        {
          credentials: { gmail_access_token: 'fake-token' },
          input: {},
          results: {},
          variables: {},
        }
      );

      expect(result.message_id).toBe('msg-123');
      expect(fetch).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        expect.any(Object)
      );
    });

    it('throws error when credentials missing', async () => {
      await expect(
        gmailExecutor.execute(
          { action: 'send', to: 'test@example.com' },
          { credentials: {}, input: {}, results: {}, variables: {} }
        )
      ).rejects.toThrow('Gmail credentials not found');
    });
  });
});
```

### 2.4 Component Tests Template
```typescript
// components/agent/AgentCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentCard } from './AgentCard';

const mockAgent = {
  id: '1',
  name: 'Test Agent',
  description: 'Test description',
  price: 999,
  rating: 4.5,
  category: 'productivity',
};

describe('AgentCard', () => {
  it('renders agent name and description', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays formatted price', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AgentCard agent={mockAgent} onClick={onClick} />);
    
    await userEvent.click(screen.getByRole('article'));
    
    expect(onClick).toHaveBeenCalledWith(mockAgent.id);
  });
});
```

---

## 3. INTEGRATION TESTS

### 3.1 API Tests Template
```typescript
// app/api/agents/__tests__/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Test database connection
const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
);

describe('GET /api/agents', () => {
  beforeAll(async () => {
    // Seed test data
    await supabase.from('agents').insert([
      { name: 'Test Agent 1', status: 'approved' },
      { name: 'Test Agent 2', status: 'approved' },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('agents').delete().match({ name: 'Test Agent 1' });
    await supabase.from('agents').delete().match({ name: 'Test Agent 2' });
  });

  it('returns paginated agents', async () => {
    const request = new NextRequest('http://localhost/api/agents?page=1&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
  });

  it('filters by category', async () => {
    const request = new NextRequest('http://localhost/api/agents?category=productivity');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.every((a: any) => a.category === 'productivity')).toBe(true);
  });
});

describe('POST /api/agents', () => {
  it('requires authentication', async () => {
    const request = new NextRequest('http://localhost/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Agent' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

### 3.2 Workflow Engine Tests
```typescript
// lib/workflow/__tests__/engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { WorkflowEngine } from '../engine';

describe('WorkflowEngine', () => {
  const mockWorkflow = {
    id: 'wf-1',
    nodes: [
      { id: 'trigger-1', type: 'trigger', data: { triggerType: 'manual' } },
      { id: 'gmail-1', type: 'gmail', data: { action: 'send', to: 'test@example.com' } },
    ],
    edges: [
      { source: 'trigger-1', target: 'gmail-1' },
    ],
  };

  it('executes nodes in correct order', async () => {
    const executionOrder: string[] = [];
    
    vi.mock('../executors', () => ({
      getExecutor: (type: string) => ({
        execute: async () => {
          executionOrder.push(type);
          return { success: true };
        },
      }),
    }));

    const engine = new WorkflowEngine(mockWorkflow);
    await engine.execute({ input: {} });

    expect(executionOrder).toEqual(['trigger', 'gmail']);
  });

  it('handles errors gracefully', async () => {
    vi.mock('../executors', () => ({
      getExecutor: () => ({
        execute: async () => {
          throw new Error('API error');
        },
      }),
    }));

    const engine = new WorkflowEngine(mockWorkflow);
    const result = await engine.execute({ input: {} });

    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
  });
});
```

---

## 4. E2E TESTS

### 4.1 Playwright Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2E Test Templates
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('can sign in with email', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrong');
    await page.click('[data-testid="signin-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

```typescript
// e2e/workflow-builder.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Workflow Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Login as developer
    await page.goto('/signin');
    await page.fill('[data-testid="email-input"]', 'developer@test.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="signin-button"]');
    await page.waitForURL('/dashboard');
  });

  test('can create new workflow', async ({ page }) => {
    await page.goto('/developer/workflows/new');
    
    // Add trigger node
    await page.click('[data-testid="node-palette-trigger"]');
    await page.click('[data-testid="canvas"]');
    
    // Add Gmail node
    await page.click('[data-testid="node-palette-gmail"]');
    await page.click('[data-testid="canvas"]', { position: { x: 300, y: 200 } });
    
    // Connect nodes
    await page.dragAndDrop('[data-testid="node-trigger-1-output"]', '[data-testid="node-gmail-1-input"]');
    
    // Save workflow
    await page.fill('[data-testid="workflow-name"]', 'Test Workflow');
    await page.click('[data-testid="save-workflow"]');
    
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });
});
```

---

## 5. TEST COVERAGE GOALS

### 5.1 Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| **lib/utils** | 90% | 🔴 High |
| **lib/workflow/executors** | 85% | 🔴 High |
| **lib/workflow/engine** | 80% | 🔴 High |
| **components/ui** | 70% | 🟡 Medium |
| **components/workflow** | 75% | 🟡 Medium |
| **API routes** | 80% | 🔴 High |
| **E2E critical paths** | 100% | 🔴 High |

### 5.2 Critical Paths (Must Test)

```markdown
1. Authentication Flow
   - Sign in / Sign up / Sign out
   - OAuth callback
   - Password reset

2. Marketplace Flow
   - Browse agents
   - Search and filter
   - View agent detail
   - Checkout and purchase

3. Workflow Builder Flow
   - Create workflow
   - Add/remove nodes
   - Connect nodes
   - Save workflow
   - Test workflow
   - Publish as agent

4. Execution Flow
   - Run agent
   - View status
   - View results
   - View history

5. Admin Flow
   - Approve/reject agents
   - Manage users
   - View analytics
```

---

## 6. TESTING TOOLS

### 6.1 Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### 6.2 Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'e2e'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 6.3 MSW for API Mocking
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/agents', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: 'Mock Agent', price: 999 },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    });
  }),
  
  http.post('/api/workflows/:id/execute', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        execution_id: 'exec-123',
        status: 'completed',
        results: {},
      },
    });
  }),
];
```

---

## 7. CI/CD INTEGRATION

### 7.1 GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          TEST_DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 7.2 NPM Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 📋 TESTING CHECKLIST (Vibe-Coding)

```markdown
## Before PR

[ ] Unit tests pass (`npm run test:unit`)
[ ] Coverage >= 80% for changed files
[ ] Integration tests pass (`npm run test:integration`)
[ ] E2E tests pass for affected flows (`npm run test:e2e`)
[ ] No console.log in test files
[ ] Test names are descriptive

## Test Quality

[ ] Tests are independent (can run in any order)
[ ] Tests clean up after themselves
[ ] Mock external APIs appropriately
[ ] Test both success and error cases
[ ] Use data-testid for E2E selectors
```
