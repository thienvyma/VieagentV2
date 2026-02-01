# Vibe-Coding AI Rules - VieAgent.vn v2

## 🤖 Nguyên tắc Vibe Coding 100%

> **Tài liệu này dành cho AI coding assistants (Cursor, Copilot, Claude, etc.) khi làm việc với codebase này.**

---

## 📋 MỤC LỤC

1. [Nguyên tắc Cơ bản](#1-nguyên-tắc-cơ-bản)
2. [Code Generation Rules](#2-code-generation-rules)
3. [Error Prevention](#3-error-prevention)
4. [Consistency Rules](#4-consistency-rules)
5. [Forbidden Patterns](#5-forbidden-patterns)
6. [Required Patterns](#6-required-patterns)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. NGUYÊN TẮC CƠ BẢN

### ✅ AI PHẢI:

```markdown
1. Đọc file constants/ TRƯỚC khi viết code mới
2. Kiểm tra types/ để hiểu data structure
3. Follow existing patterns trong codebase
4. Update constants nếu cần thêm giá trị mới
5. Validate inputs ở MỌI nơi nhận user input
6. Handle EVERY possible error
7. Log errors với context đầy đủ
8. Comment code phức tạp bằng tiếng Anh
```

### ❌ AI KHÔNG ĐƯỢC:

```markdown
1. Hardcode BẤT KỲ giá trị nào (số, text, URL, color)
2. Để `any` type nếu có thể define type
3. Ignore TypeScript errors
4. Ignore ESLint warnings
5. Skip error handling với empty catch blocks
6. Duplicate code đã tồn tại
7. Create files outside của structure đã định
8. Mix naming conventions
```

---

## 2. CODE GENERATION RULES

### 📄 Khi tạo Component mới:

```typescript
// ✅ TEMPLATE BẮT BUỘC

'use client'; // Nếu cần client-side

// 1. React imports
import { useState, useEffect, memo } from 'react';

// 2. Next.js imports
import Image from 'next/image';
import Link from 'next/link';

// 3. Third-party imports
import { LucideIcon } from 'lucide-react';

// 4. Internal imports (theo thứ tự)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { MESSAGES } from '@/constants/messages';
import type { Agent } from '@/types';

// 5. Props interface (LUÔN ĐỊNH NGHĨA)
interface MyComponentProps {
  data: Agent;
  onAction?: (id: string) => void;
  className?: string;
}

// 6. Component với memo nếu cần
export const MyComponent = memo(function MyComponent({
  data,
  onAction,
  className = '',
}: MyComponentProps) {
  // 7. Hooks ở đầu
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // 8. Handlers
  const handleAction = async () => {
    try {
      setLoading(true);
      // logic
      onAction?.(data.id);
    } catch (error) {
      console.error('[MyComponent] Action failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 9. Early returns
  if (!data) return null;
  
  // 10. Render
  return (
    <div className={`base-styles ${className}`}>
      {/* JSX */}
    </div>
  );
});

// 11. Default export cho lazy loading
export default MyComponent;
```

### 📄 Khi tạo API Route mới:

```typescript
// ✅ TEMPLATE BẮT BUỘC

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ERROR_CODES } from '@/constants/errors';
import { LIMITS } from '@/constants/limits';
import { MESSAGES } from '@/constants/messages';
import { validateInput } from '@/lib/validators';
import type { ApiResponse, MyDataType } from '@/types';

// 1. Định nghĩa response helper
function jsonResponse<T>(data: ApiResponse<T>, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(code: string, message: string, status = 500) {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

// 2. GET handler
export async function GET(request: NextRequest) {
  try {
    // 2.1 Parse params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    
    // 2.2 Auth check (nếu cần)
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, MESSAGES.ERRORS.UNAUTHORIZED, 401);
    }
    
    // 2.3 Fetch data
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[API] Database error:', error);
      return errorResponse(ERROR_CODES.DATABASE_ERROR, error.message);
    }
    
    // 2.4 Return success
    return jsonResponse({ success: true, data });
    
  } catch (error) {
    // 2.5 Catch-all error
    console.error('[API] Unexpected error:', error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, MESSAGES.ERRORS.GENERIC);
  }
}

// 3. POST handler
export async function POST(request: NextRequest) {
  try {
    // 3.1 Parse body
    const body = await request.json();
    
    // 3.2 Validate input
    const validation = validateInput(body, {
      name: { required: true, minLength: LIMITS.AGENT_NAME_MIN_LENGTH },
      // ...
    });
    
    if (!validation.valid) {
      return errorResponse(
        ERROR_CODES.VALIDATION_ERROR, 
        MESSAGES.ERRORS.VALIDATION, 
        400
      );
    }
    
    // ... rest of logic
    
  } catch (error) {
    console.error('[API] POST error:', error);
    return errorResponse(ERROR_CODES.INTERNAL_ERROR, MESSAGES.ERRORS.GENERIC);
  }
}
```

### 📄 Khi tạo Hook mới:

```typescript
// ✅ TEMPLATE BẮT BUỘC

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { MESSAGES } from '@/constants/messages';
import type { DataType, ApiResponse } from '@/types';

// 1. Định nghĩa options interface
interface UseMyHookOptions {
  initialValue?: DataType;
  autoFetch?: boolean;
}

// 2. Định nghĩa return type
interface UseMyHookReturn {
  data: DataType | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (newData: Partial<DataType>) => Promise<boolean>;
}

// 3. Hook implementation
export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  const { initialValue = null, autoFetch = true } = options;
  
  // 4. State
  const [data, setData] = useState<DataType | null>(initialValue);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // 5. Fetch function (memoized)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.MY_ENDPOINT);
      const result: ApiResponse<DataType> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || MESSAGES.ERRORS.GENERIC);
      }
      
      setData(result.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : MESSAGES.ERRORS.GENERIC;
      setError(message);
      console.error('[useMyHook] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 6. Update function
  const update = useCallback(async (newData: Partial<DataType>): Promise<boolean> => {
    try {
      setLoading(true);
      // update logic
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : MESSAGES.ERRORS.GENERIC);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 7. Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);
  
  // 8. Return
  return { data, loading, error, refetch: fetchData, update };
}
```

---

## 3. ERROR PREVENTION

### 🔴 Lỗi phổ biến và cách tránh:

| Lỗi | Nguyên nhân | Cách tránh |
|-----|-------------|------------|
| "Cannot read property of undefined" | Không check null | Dùng optional chaining `?.` |
| "Hydration mismatch" | SSR/CSR render khác | Dùng `'use client'` đúng chỗ |
| "Type 'string' is not assignable" | Sai type | Define types chính xác |
| "Module not found" | Import path sai | Dùng `@/` alias |
| "API 404" | Endpoint path sai | Dùng constants/api.ts |
| "CORS error" | API domain sai | Dùng relative path |
| "Unhandled rejection" | Không catch async | Luôn try/catch |
| "Maximum update depth" | Infinite loop | Check useEffect deps |

### ✅ Checklist trước mỗi commit:

```markdown
[ ] No TypeScript errors (`tsc --noEmit`)
[ ] No ESLint errors (`npm run lint`)
[ ] All API endpoints exist
[ ] All constants imported (không hardcode)
[ ] All types defined (không `any`)
[ ] All errors handled (không empty catch)
[ ] All async functions có try/catch
[ ] Console.error có context `[ComponentName]`
```

---

## 4. CONSISTENCY RULES

### 🔄 Frontend ↔ Backend ↔ Database

```
Database (snake_case)  →  Backend (snake_case)  →  Frontend (camelCase)
─────────────────────────────────────────────────────────────────────────
user_id                →  user_id               →  userId
created_at             →  created_at            →  createdAt
stripe_customer_id     →  stripe_customer_id    →  stripeCustomerId
```

### ✅ Utility function cho mapping:

```typescript
// lib/utils.ts

// snake_case → camelCase
export function toCamelCase<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// camelCase → snake_case
export function toSnakeCase<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}
```

### ✅ Status values (PHẢI NHẤT QUÁN):

```typescript
// constants/status.ts

// Database column values = Frontend values = API values
export const STATUS = {
  // User status
  USER: {
    ACTIVE: 'active',
    INACTIVE: 'inactive', 
    BANNED: 'banned',
  },
  
  // Agent status
  AGENT: {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
  
  // Execution status
  EXECUTION: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  
  // Ticket status
  TICKET: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
  },
} as const;
```

---

## 5. FORBIDDEN PATTERNS

### ❌ TUYỆT ĐỐI KHÔNG:

```typescript
// ❌ 1. Hardcode strings
className="text-blue-500"        // ❌
APP_NAME = "VieAgent"           // ❌ trong component

// ❌ 2. Magic numbers
if (credits < 100)               // ❌
setTimeout(() => {}, 3000)       // ❌

// ❌ 3. Any type
const data: any = ...            // ❌
function handle(e: any)          // ❌

// ❌ 4. Empty catch
try { ... } catch {}             // ❌
.catch(() => {})                 // ❌

// ❌ 5. Console.log trong production
console.log('debug')             // ❌

// ❌ 6. Non-null assertion lạm dụng
user!.email                      // ❌ (chỉ dùng khi CHẮC CHẮN)

// ❌ 7. Index as key
{items.map((item, i) => <div key={i}>)}  // ❌

// ❌ 8. Inline event handlers phức tạp
onClick={() => { 
  fetch(); setData(); navigate(); 
}}  // ❌

// ❌ 9. Duplicate constants
const API_URL = 'https://...'    // ❌ (đã có trong constants)

// ❌ 10. Mixed naming
getUserData() + get_user_profile()  // ❌
```

---

## 6. REQUIRED PATTERNS

### ✅ BẮT BUỘC PHẢI:

```typescript
// ✅ 1. Dùng constants
import { LIMITS, ROUTES, MESSAGES } from '@/constants';
if (credits < LIMITS.MIN_CREDITS)

// ✅ 2. Define types
interface MyProps { data: Agent; onAction: () => void; }
const data: Agent[] = [];

// ✅ 3. Handle errors
try {
  await fetchData();
} catch (error) {
  console.error('[Component] Error:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}

// ✅ 4. Optional chaining
const name = user?.profile?.fullName ?? 'Guest';

// ✅ 5. Loading states
if (loading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;

// ✅ 6. Unique keys
{items.map(item => <Card key={item.id} />)}

// ✅ 7. Extract handlers
const handleSubmit = useCallback(async () => { ... }, [deps]);

// ✅ 8. Memoize expensive operations
const filteredData = useMemo(() => 
  data.filter(...), 
  [data, filterCriteria]
);

// ✅ 9. Early returns
if (!user) return <Redirect to={ROUTES.SIGNIN} />;
if (!data.length) return <EmptyState />;

// ✅ 10. Accessible components
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>
```

---

## 7. TESTING CHECKLIST

### 📋 Trước khi merge code:

```markdown
## Functionality
[ ] Feature hoạt động đúng theo spec
[ ] Edge cases được handle (null, empty, error)
[ ] Loading states hiển thị đúng
[ ] Error messages rõ ràng, user-friendly

## Code Quality
[ ] No TypeScript errors
[ ] No ESLint warnings
[ ] No console.log (chỉ console.error với context)
[ ] No hardcoded values
[ ] No duplicate code
[ ] No any types

## Consistency
[ ] Naming conventions đúng
[ ] Import order đúng
[ ] File location đúng
[ ] API response format đúng
[ ] Database column names khớp

## Performance
[ ] No unnecessary re-renders
[ ] Images optimized (next/image)
[ ] Lazy loading cho components lớn
[ ] Proper memoization

## Accessibility
[ ] Keyboard navigation works
[ ] Screen reader friendly
[ ] Proper aria labels
[ ] Color contrast OK

## Security
[ ] Input validated
[ ] SQL injection prevented (parameterized queries)
[ ] XSS prevented (no dangerouslySetInnerHTML)
[ ] Auth checked trước protected routes
```

---

## 📌 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    VIBE-CODING QUICK REF                    │
├─────────────────────────────────────────────────────────────┤
│ FILES:          components/ui/  → Shadcn components         │
│                 constants/      → ALL hardcoded values      │
│                 types/          → ALL TypeScript types      │
│                 hooks/          → Custom hooks              │
│                 lib/            → Utilities                 │
├─────────────────────────────────────────────────────────────┤
│ NAMING:         Components      → PascalCase                │
│                 files           → kebab-case or camelCase   │
│                 hooks           → useCamelCase              │
│                 constants       → SCREAMING_SNAKE           │
│                 db columns      → snake_case                │
├─────────────────────────────────────────────────────────────┤
│ API RESPONSE:   { success, data, error, pagination }        │
│ ERROR FORMAT:   { code: 'ERROR_CODE', message: 'text' }     │
├─────────────────────────────────────────────────────────────┤
│ BEFORE COMMIT:  tsc --noEmit && npm run lint                │
└─────────────────────────────────────────────────────────────┘
```
