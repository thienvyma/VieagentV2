# 🧪 Testing Guide - VieAgent V2

## 🎯 Testing Philosophy

VieAgent V2 prioritizes **integration tests** over unit tests because:
1. We integrate with external services (Flowise, Supabase)
2. Security is critical (credential encryption)
3. User flows are complex (auth → vault → execution)

---

## 🏗️ Testing Stack

### Recommended Tools
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0",
    "msw": "^2.0.0" // Mock Service Worker for API mocking
  }
}
```

### Setup Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
```

---

## 🔐 Testing Credential Encryption

### Unit Test: Encryption/Decryption
```typescript
// __tests__/lib/encryption.test.ts
import { encrypt, decrypt } from '@/lib/encryption';

describe('Credential Encryption', () => {
  it('should encrypt and decrypt correctly', async () => {
    const original = 'sk-test-openai-key-123';
    
    const { encrypted, iv } = await encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(iv).toBeDefined();
    
    const decrypted = await decrypt(encrypted, iv);
    expect(decrypted).toBe(original);
  });
  
  it('should produce different ciphertext for same input', async () => {
    const original = 'sk-test-key';
    
    const result1 = await encrypt(original);
    const result2 = await encrypt(original);
    
    // Different IV = different ciphertext
    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);
  });
  
  it('should fail with wrong IV', async () => {
    const original = 'sk-test-key';
    const { encrypted, iv } = await encrypt(original);
    
    const wrongIv = 'wrong-iv-value';
    
    await expect(decrypt(encrypted, wrongIv)).rejects.toThrow();
  });
});
```

---

## 🔌 Testing Flowise Integration

### Mock Flowise API
```typescript
// __tests__/lib/engines/flowise.test.ts
import { FlowiseClient } from '@/lib/engines/flowise';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('http://localhost:3000/api/v1/prediction/:flowId', (req, res, ctx) => {
    return res(
      ctx.json({
        text: 'Mocked AI response',
        chatId: 'mock-chat-id'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FlowiseClient', () => {
  it('should execute workflow successfully', async () => {
    const client = new FlowiseClient({
      apiUrl: 'http://localhost:3000'
    });
    
    const result = await client.executeWorkflow({
      flowId: 'test-flow-id',
      inputs: { question: 'What is AI?' },
      credentials: { openai: 'sk-test' }
    });
    
    expect(result.text).toBe('Mocked AI response');
  });
  
  it('should handle API errors', async () => {
    server.use(
      rest.post('http://localhost:3000/api/v1/prediction/:flowId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal error' }));
      })
    );
    
    const client = new FlowiseClient();
    
    await expect(
      client.executeWorkflow({
        flowId: 'test-flow-id',
        inputs: {},
        credentials: {}
      })
    ).rejects.toThrow('Internal error');
  });
});
```

---

## 🎨 Testing React Components

### Test: DynamicForm
```typescript
// __tests__/components/business/forms/dynamic-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicForm } from '@/components/business/forms/dynamic-form';

describe('DynamicForm', () => {
  const mockSchema = {
    fields: [
      {
        name: 'topic',
        type: 'text',
        label: 'Topic',
        required: true
      },
      {
        name: 'tone',
        type: 'select',
        label: 'Tone',
        options: [
          { value: 'professional', label: 'Professional' },
          { value: 'casual', label: 'Casual' }
        ]
      }
    ]
  };
  
  it('should render all fields', () => {
    render(
      <DynamicForm
        schema={mockSchema}
        onSubmit={jest.fn()}
      />
    );
    
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    
    render(
      <DynamicForm
        schema={mockSchema}
        onSubmit={onSubmit}
      />
    );
    
    // Submit without filling required field
    fireEvent.click(screen.getByText('Run Agent'));
    
    await waitFor(() => {
      expect(screen.getByText(/Topic is required/i)).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit valid data', async () => {
    const onSubmit = jest.fn();
    
    render(
      <DynamicForm
        schema={mockSchema}
        onSubmit={onSubmit}
      />
    );
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Topic'), {
      target: { value: 'AI trends' }
    });
    
    // Submit
    fireEvent.click(screen.getByText('Run Agent'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        topic: 'AI trends',
        tone: undefined
      });
    });
  });
});
```

---

## 🌐 Testing API Routes

### Test: Execution API
```typescript
// __tests__/app/api/execute/[agentId]/route.test.ts
import { POST } from '@/app/api/execute/[agentId]/route';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server');
jest.mock('@/lib/engines/flowise');

describe('POST /api/execute/[agentId]', () => {
  it('should require authentication', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } })
      }
    });
    
    const request = new Request('http://localhost/api/execute/test-id', {
      method: 'POST',
      body: JSON.stringify({ inputs: {} })
    });
    
    const response = await POST(request, { params: { agentId: 'test-id' } });
    
    expect(response.status).toBe(401);
  });
  
  it('should execute agent successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockAgent = {
      id: 'agent-123',
      engine_flow_id: 'flow-123',
      required_credential_types: ['openai']
    };
    
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } })
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAgent })
          })
        })
      })
    });
    
    const request = new Request('http://localhost/api/execute/agent-123', {
      method: 'POST',
      body: JSON.stringify({
        inputs: { topic: 'AI' },
        credential_ids: { openai: 'cred-123' }
      })
    });
    
    const response = await POST(request, { params: { agentId: 'agent-123' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.execution_id).toBeDefined();
  });
});
```

---

## 🔄 End-to-End Testing

### E2E Test: Full User Flow
```typescript
// __tests__/e2e/agent-execution.test.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Execution Flow', () => {
  test('user can run agent end-to-end', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 2. Navigate to Vault
    await page.goto('/dashboard/credentials');
    
    // 3. Add API Key
    await page.click('text=Add Credential');
    await page.selectOption('select[name="provider"]', 'openai');
    await page.fill('input[name="keyName"]', 'My Test Key');
    await page.fill('input[name="apiKey"]', 'sk-test-key-123');
    await page.click('button:has-text("Encrypt & Save")');
    
    await expect(page.locator('text=Credential saved')).toBeVisible();
    
    // 4. Navigate to Agent
    await page.goto('/dashboard');
    await page.click('text=Test Agent');
    
    // 5. Fill Form
    await page.fill('input[name="topic"]', 'AI trends');
    await page.selectOption('select[name="openai_key"]', 'My Test Key');
    
    // 6. Run Agent
    await page.click('button:has-text("Run Agent")');
    
    // 7. Wait for Result
    await expect(page.locator('text=Execution completed')).toBeVisible({
      timeout: 30000
    });
    
    // 8. Verify Output
    const output = await page.locator('[data-testid="execution-output"]').textContent();
    expect(output).toBeTruthy();
  });
});
```

---

## 🛡️ Security Testing

### Test: Credential Exposure
```typescript
describe('Security: Credential Exposure', () => {
  it('should never expose decrypted keys in API response', async () => {
    const response = await fetch('/api/execute/test-agent', {
      method: 'POST',
      body: JSON.stringify({
        inputs: { topic: 'AI' },
        credential_ids: { openai: 'cred-123' }
      })
    });
    
    const data = await response.json();
    const responseText = JSON.stringify(data);
    
    // Check that no API key patterns are in response
    expect(responseText).not.toMatch(/sk-[a-zA-Z0-9]{32,}/);
    expect(responseText).not.toMatch(/AIza[a-zA-Z0-9]{35}/); // Google API key
  });
  
  it('should not log decrypted credentials', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    await executeAgent({
      agentId: 'test-id',
      inputs: {},
      credentials: { openai: 'sk-secret-key' }
    });
    
    const logs = consoleSpy.mock.calls.flat().join(' ');
    expect(logs).not.toContain('sk-secret-key');
    
    consoleSpy.mockRestore();
  });
});
```

---

## 📊 Performance Testing

### Test: Execution Timeout
```typescript
describe('Performance: Execution Timeout', () => {
  it('should timeout after 5 minutes', async () => {
    jest.setTimeout(6 * 60 * 1000); // 6 minutes
    
    const startTime = Date.now();
    
    try {
      await executeAgent({
        agentId: 'slow-agent',
        inputs: {}
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      expect(error.message).toContain('TIMEOUT');
      expect(duration).toBeLessThan(5.5 * 60 * 1000); // Max 5.5 minutes
    }
  });
});
```

---

## 🎯 Test Coverage Goals

### Minimum Coverage
- **Unit Tests**: 80% coverage for utility functions
- **Integration Tests**: 70% coverage for API routes
- **E2E Tests**: Cover all critical user flows

### Priority Areas
1. 🔴 **Critical**: Credential encryption/decryption
2. 🔴 **Critical**: Execution API with credential injection
3. 🟡 **High**: Form validation
4. 🟡 **High**: Authentication flows
5. 🟢 **Medium**: UI components

---

## 🚀 Running Tests

### Commands
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- encryption.test.ts

# Run in watch mode
npm test -- --watch

# Run E2E tests
npx playwright test
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx playwright test
```

---

## 📚 Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Mock external services (Flowise, Supabase)**
4. **Test error cases, not just happy paths**
5. **Keep tests fast (< 1s per test)**
6. **Use test data factories for consistency**
7. **Clean up after tests (database, mocks)**

---

## 🎉 Testing Checklist

Before deploying to production:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests cover critical flows
- [ ] Security tests verify no credential exposure
- [ ] Performance tests verify timeouts work
- [ ] Test coverage > 70%
- [ ] No console errors in tests
- [ ] CI/CD pipeline runs tests automatically
