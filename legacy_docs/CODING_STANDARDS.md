# Coding Standards & Rules - VieAgent.vn v2

## 🎯 Nguyên tắc Cốt lõi

> **"Không hardcode. Dùng constants. Maintain được."**

---

## 📋 MỤC LỤC

1. [Shared Tokens & Constants](#1-shared-tokens--constants)
2. [Type Safety](#2-type-safety)
3. [API Conventions](#3-api-conventions)
4. [Component Standards](#4-component-standards)
5. [Error Handling](#5-error-handling)
6. [Database Consistency](#6-database-consistency)
7. [File Organization](#7-file-organization)
8. [Naming Conventions](#8-naming-conventions)
9. [Git & Code Review](#9-git--code-review)
10. [Vibe-Coding Rules](#10-vibe-coding-rules)

---

## 1. SHARED TOKENS & CONSTANTS

### ❌ KHÔNG làm (Hardcode):
```typescript
// ❌ SAI - Hardcode màu
<div className="bg-blue-500">

// ❌ SAI - Hardcode text
<h1>Welcome to VieAgent</h1>

// ❌ SAI - Hardcode URL
fetch('https://api.vieagent.vn/agents')

// ❌ SAI - Hardcode số
if (user.credits < 100) { ... }
```

### ✅ NÊN làm (Dùng Tokens):
```typescript
// ✅ ĐÚNG - Dùng CSS variables / Tailwind config
<div className="bg-primary">

// ✅ ĐÚNG - Dùng constants
<h1>{APP_CONFIG.name}</h1>

// ✅ ĐÚNG - Dùng env variables
fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`)

// ✅ ĐÚNG - Dùng constants
if (user.credits < LIMITS.MIN_CREDITS) { ... }
```

---

### 📁 File Constants Structure

```
src/
├── constants/
│   ├── index.ts           # Re-export all
│   ├── app.ts             # App config
│   ├── api.ts             # API endpoints
│   ├── limits.ts          # Số limits
│   ├── messages.ts        # UI messages
│   ├── routes.ts          # App routes
│   └── ui.ts              # UI constants
```

### 📄 constants/app.ts
```typescript
export const APP_CONFIG = {
  name: 'VieAgent.vn',
  tagline: 'AI Agent Marketplace',
  version: '2.0.0',
  supportEmail: 'support@vieagent.vn',
  socials: {
    twitter: 'https://twitter.com/vieagent',
    discord: 'https://discord.gg/vieagent',
  },
} as const;

export const COMPANY = {
  name: 'VieAgent Inc.',
  address: '...',
  taxId: '...',
} as const;
```

### 📄 constants/limits.ts
```typescript
export const LIMITS = {
  // Credits
  FREE_CREDITS: 100,
  PRO_CREDITS: 5000,
  MIN_CREDITS_TO_RUN: 1,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File uploads
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  
  // Rate limiting
  API_REQUESTS_PER_MINUTE: 60,
  EXECUTIONS_PER_HOUR: 100,
  
  // Text limits
  AGENT_NAME_MIN_LENGTH: 3,
  AGENT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  REVIEW_MAX_LENGTH: 5000,
  
  // Pricing
  MIN_AGENT_PRICE: 0,
  MAX_AGENT_PRICE: 10000,
  PLATFORM_FEE_PERCENT: 30,
  DEVELOPER_SHARE_PERCENT: 70,
} as const;
```

### 📄 constants/routes.ts
```typescript
export const ROUTES = {
  // Public
  HOME: '/',
  MARKETPLACE: '/marketplace',
  AGENT_DETAIL: (id: string) => `/marketplace/${id}`,
  PRICING: '/pricing',
  
  // Auth
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Customer
  CUSTOMER_DASHBOARD: '/customer',
  MY_AGENTS: '/customer/agents',
  MY_INTEGRATIONS: '/customer/integrations',
  BILLING: '/customer/billing',
  
  // Developer
  DEV_DASHBOARD: '/developer',
  CREATE_AGENT: '/developer/create',
  EDIT_AGENT: (id: string) => `/developer/agents/${id}/edit`,
  DEV_ANALYTICS: '/developer/analytics',
  DEV_EARNINGS: '/developer/earnings',
  
  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_SUPPORT: '/admin/support',
} as const;
```

### 📄 constants/api.ts
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNIN: `${API_BASE}/auth/signin`,
    SIGNUP: `${API_BASE}/auth/signup`,
    SIGNOUT: `${API_BASE}/auth/signout`,
    ME: `${API_BASE}/auth/me`,
  },
  
  // Agents
  AGENTS: {
    LIST: `${API_BASE}/agents`,
    DETAIL: (id: string) => `${API_BASE}/agents/${id}`,
    CREATE: `${API_BASE}/agents`,
    UPDATE: (id: string) => `${API_BASE}/agents/${id}`,
    DELETE: (id: string) => `${API_BASE}/agents/${id}`,
    MY_AGENTS: `${API_BASE}/agents/me`,
  },
  
  // Executions
  EXECUTIONS: {
    RUN: `${API_BASE}/execute-agent`,
    LIST: `${API_BASE}/executions`,
    DETAIL: (id: string) => `${API_BASE}/executions/${id}`,
  },
  
  // ... more endpoints
} as const;
```

### 📄 constants/messages.ts
```typescript
export const MESSAGES = {
  // Success
  SUCCESS: {
    AGENT_CREATED: 'Agent đã được tạo thành công!',
    AGENT_UPDATED: 'Agent đã được cập nhật!',
    AGENT_DELETED: 'Agent đã được xóa!',
    PURCHASE_SUCCESS: 'Mua thành công!',
    CREDENTIAL_SAVED: 'Credential đã được lưu!',
  },
  
  // Errors
  ERRORS: {
    GENERIC: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện thao tác này.',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu.',
    VALIDATION: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
    NETWORK: 'Lỗi kết nối. Vui lòng kiểm tra mạng.',
    INSUFFICIENT_CREDITS: 'Không đủ credits để chạy agent.',
  },
  
  // Confirmations
  CONFIRM: {
    DELETE_AGENT: 'Bạn có chắc muốn xóa agent này? Hành động không thể hoàn tác.',
    CANCEL_SUBSCRIPTION: 'Bạn có chắc muốn hủy subscription?',
    DISCONNECT_INTEGRATION: 'Bạn có chắc muốn ngắt kết nối?',
  },
  
  // Placeholders
  PLACEHOLDERS: {
    SEARCH: 'Tìm kiếm agents...',
    EMAIL: 'email@example.com',
    PASSWORD: 'Nhập mật khẩu',
  },
} as const;
```

### 📄 constants/ui.ts
```typescript
export const UI = {
  // Breakpoints (match Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
  
  // Animations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast durations
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 4000,
  },
  
  // Categories
  AGENT_CATEGORIES: [
    { id: 'automation', label: 'Automation', icon: '⚡' },
    { id: 'data', label: 'Data Processing', icon: '📊' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'productivity', label: 'Productivity', icon: '🎯' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'support', label: 'Customer Support', icon: '🎧' },
    { id: 'development', label: 'Development', icon: '💻' },
    { id: 'other', label: 'Other', icon: '📦' },
  ] as const,
  
  // User roles
  USER_ROLES: [
    { id: 'customer', label: 'Customer', color: 'blue' },
    { id: 'developer', label: 'Developer', color: 'green' },
    { id: 'admin', label: 'Admin', color: 'red' },
  ] as const,
  
  // Status badges
  AGENT_STATUS: {
    draft: { label: 'Draft', color: 'gray' },
    pending: { label: 'Pending Review', color: 'yellow' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
  } as const,
  
  EXECUTION_STATUS: {
    pending: { label: 'Pending', color: 'gray' },
    running: { label: 'Running', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    failed: { label: 'Failed', color: 'red' },
  } as const,
} as const;
```

---

## 2. TYPE SAFETY

### ✅ Quy tắc Types

```typescript
// 📁 types/index.ts - Re-export all types
export * from './user';
export * from './agent';
export * from './execution';
export * from './api';

// 📁 types/user.ts
export type UserRole = 'customer' | 'developer' | 'admin';
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  fullName: string | null;
  avatarUrl: string | null;
  credits: number;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Partial types cho forms
export type UserUpdateInput = Partial<Pick<User, 'fullName' | 'avatarUrl'>>;

// 📁 types/agent.ts
export type AgentStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type AgentCategory = typeof UI.AGENT_CATEGORIES[number]['id'];

export interface Agent {
  id: string;
  developerId: string;
  name: string;
  description: string;
  category: AgentCategory;
  tags: string[];
  priceOneTime: number | null;
  priceMonthly: number | null;
  webhookUrl: string;
  inputSchema: InputField[];
  status: AgentStatus;
  isFeatured: boolean;
  totalSales: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InputField {
  name: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

// 📁 types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, string>;
};
```

### ✅ Generate Types từ Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Generate types
supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

---

## 3. API CONVENTIONS

### ✅ API Response Format (NHẤT QUÁN)

```typescript
// ✅ LUÔN trả về cùng format

// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Success with pagination
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "email": "This field is required"
    }
  }
}
```

### ✅ Error Codes (CHUẨN HÓA)

```typescript
// constants/errors.ts
export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Business logic errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  AGENT_NOT_APPROVED: 'AGENT_NOT_APPROVED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

### ✅ API Route Template

```typescript
// app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ERROR_CODES } from '@/constants/errors';
import { LIMITS } from '@/constants/limits';
import { validateAgentInput } from '@/lib/validators';
import type { ApiResponse, Agent } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(LIMITS.DEFAULT_PAGE_SIZE)),
      LIMITS.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('agents')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    const response: ApiResponse<Agent[]> = {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] GET /agents error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch agents',
      },
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
```

---

## 4. COMPONENT STANDARDS

### ✅ Component Template

```typescript
// components/agent/AgentCard.tsx
'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { UI } from '@/constants/ui';
import { formatPrice } from '@/lib/utils';
import type { Agent } from '@/types';

// Props interface - LUÔN ĐỊNH NGHĨA
interface AgentCardProps {
  agent: Agent;
  showDeveloper?: boolean;
  onPurchase?: (agentId: string) => void;
  className?: string;
}

// Component - DÙNG MEMO NẾU CẦN
export const AgentCard = memo(function AgentCard({
  agent,
  showDeveloper = true,
  onPurchase,
  className = '',
}: AgentCardProps) {
  // Handlers
  const handlePurchase = () => {
    onPurchase?.(agent.id);
  };
  
  // Computed values
  const categoryInfo = UI.AGENT_CATEGORIES.find(c => c.id === agent.category);
  const statusInfo = UI.AGENT_STATUS[agent.status];
  
  return (
    <Link 
      href={ROUTES.AGENT_DETAIL(agent.id)}
      className={`block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow ${className}`}
    >
      {/* ... component JSX */}
    </Link>
  );
});

// Default export for lazy loading
export default AgentCard;
```

### ✅ Hooks Standards

```typescript
// hooks/useAgents.ts
import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import type { Agent, ApiResponse } from '@/types';

interface UseAgentsOptions {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; totalPages: number } | null;
  refetch: () => Promise<void>;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number } | null>(null);
  
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.category) params.set('category', options.category);
      if (options.search) params.set('search', options.search);
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      
      const response = await fetch(`${API_ENDPOINTS.AGENTS.LIST}?${params}`);
      const result: ApiResponse<Agent[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch agents');
      }
      
      setAgents(result.data || []);
      if (result.pagination) {
        setPagination({
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [options.category, options.search, options.page, options.limit]);
  
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);
  
  return { agents, loading, error, pagination, refetch: fetchAgents };
}
```

---

## 5. ERROR HANDLING

### ✅ Quy tắc Xử lý Lỗi

```typescript
// lib/errors.ts
import { ERROR_CODES, type ErrorCode } from '@/constants/errors';
import { MESSAGES } from '@/constants/messages';

// Custom error class
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error factory functions
export const Errors = {
  unauthorized: () => new AppError(
    ERROR_CODES.UNAUTHORIZED,
    MESSAGES.ERRORS.UNAUTHORIZED,
    401
  ),
  
  forbidden: () => new AppError(
    ERROR_CODES.FORBIDDEN,
    MESSAGES.ERRORS.FORBIDDEN,
    403
  ),
  
  notFound: (resource: string) => new AppError(
    ERROR_CODES.NOT_FOUND,
    `${resource} not found`,
    404
  ),
  
  validation: (details: Record<string, string>) => new AppError(
    ERROR_CODES.VALIDATION_ERROR,
    MESSAGES.ERRORS.VALIDATION,
    400,
    details
  ),
  
  insufficientCredits: () => new AppError(
    ERROR_CODES.INSUFFICIENT_CREDITS,
    MESSAGES.ERRORS.INSUFFICIENT_CREDITS,
    402
  ),
};
```

### ✅ Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MESSAGES } from '@/constants/messages';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">
            {MESSAGES.ERRORS.GENERIC}
          </h2>
          <Button onClick={this.handleRetry}>
            Thử lại
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 6. DATABASE CONSISTENCY

### ✅ Naming Convention cho Database

| Item | Convention | Example |
|------|------------|---------|
| Tables | snake_case, plural | `users`, `agents`, `support_tickets` |
| Columns | snake_case | `created_at`, `user_id`, `stripe_customer_id` |
| Primary Keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign Keys | `{table}_id` | `user_id`, `agent_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` |
| Booleans | `is_` hoặc `has_` prefix | `is_active`, `has_verified` |
| Status columns | `status` | `status TEXT CHECK (...)` |

### ✅ TypeScript ↔ Database Mapping

```typescript
// Database column → TypeScript property
// snake_case → camelCase

// Database: created_at, updated_at, user_id
// TypeScript: createdAt, updatedAt, userId

// Utility function
export function toCamelCase<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}
```

---

## 7. FILE ORGANIZATION

### ✅ Import Order (NHẤT QUÁN)

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';

// 2. Third-party imports
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Star, User, Settings } from 'lucide-react';

// 3. Internal - UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal - Custom components
import { AgentCard } from '@/components/agent/AgentCard';

// 5. Internal - Hooks
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';

// 6. Internal - Utils/Lib
import { formatPrice, cn } from '@/lib/utils';
import { createServerClient } from '@/lib/supabase/server';

// 7. Internal - Constants
import { ROUTES } from '@/constants/routes';
import { LIMITS } from '@/constants/limits';

// 8. Internal - Types
import type { Agent, User } from '@/types';
```

---

## 8. NAMING CONVENTIONS

| Item | Convention | Example |
|------|------------|---------|
| Files - Components | PascalCase | `AgentCard.tsx`, `UserProfile.tsx` |
| Files - Hooks | camelCase with `use` prefix | `useAuth.ts`, `useAgents.ts` |
| Files - Utils | camelCase | `formatPrice.ts`, `validateInput.ts` |
| Files - Constants | camelCase | `routes.ts`, `limits.ts` |
| Files - Types | camelCase | `user.ts`, `agent.ts` |
| Folders | kebab-case hoặc camelCase | `agent-card/`, `useAuth/` |
| Components | PascalCase | `AgentCard`, `UserProfile` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useAgents` |
| Functions | camelCase | `formatPrice`, `handleSubmit` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `User`, `Agent`, `ApiResponse` |
| Enums | PascalCase | `UserRole`, `AgentStatus` |

---

## 9. GIT & CODE REVIEW

### ✅ Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Refactoring
- `docs`: Documentation
- `style`: Formatting
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(agents): add search functionality
fix(auth): resolve session expiry issue
refactor(api): standardize error responses
docs(readme): update installation instructions
```

### ✅ Branch Naming

```
<type>/<ticket-id>-<short-description>

Examples:
feat/AF-123-agent-search
fix/AF-456-login-bug
refactor/AF-789-api-cleanup
```

---

## 10. VIBE-CODING RULES

> **Các quy tắc cho AI-assisted development (100% vibe coding)**

### ✅ PHẢI tuân thủ:

1. **Không hardcode** - Luôn dùng constants/tokens
2. **Type everything** - Mọi thứ phải có TypeScript types
3. **Consistent API format** - Tất cả API trả về cùng format
4. **Error handling** - Mọi API/function phải handle errors
5. **Logging** - Log mọi errors với context đầy đủ
6. **Validation** - Validate input ở cả client và server
7. **Comments** - Comment cho logic phức tạp

### ❌ KHÔNG được làm:

1. **NO magic numbers** - Dùng constants
2. **NO inline styles** - Dùng Tailwind classes hoặc CSS variables
3. **NO any type** - Define proper types
4. **NO console.log** in production - Dùng proper logging
5. **NO ignored errors** - Handle or rethrow
6. **NO duplicate code** - Extract to utils/hooks
7. **NO mixed conventions** - Follow one pattern

### 📋 Checklist trước khi commit:

```
[ ] Không có hardcoded values
[ ] Tất cả functions có types
[ ] API responses đúng format
[ ] Errors được handle
[ ] No TypeScript errors
[ ] No ESLint warnings
[ ] Constants được dùng thay vì magic values
[ ] Import order đúng quy tắc
```
