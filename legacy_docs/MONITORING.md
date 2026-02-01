# 📊 MONITORING & OBSERVABILITY - VieAgent.vn v2

**Mục tiêu**: Track errors, performance, và user behavior

---

## 📋 MỤC LỤC

1. [Error Tracking (Sentry)](#1-error-tracking-sentry)
2. [Performance Monitoring](#2-performance-monitoring)
3. [Logging Strategy](#3-logging-strategy)
4. [Analytics](#4-analytics)
5. [Alerting](#5-alerting)

---

## 1. ERROR TRACKING (SENTRY)

### 1.1 Setup

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 1.2 Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Before send hook
  beforeSend(event, hint) {
    // Don't send in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  
  // Server-specific options
  autoSessionTracking: true,
});
```

### 1.3 Error Boundary

```typescript
// components/error-boundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 1.4 Manual Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[Error]', error.message, context);
  
  Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context?.component,
      action: context?.action,
    },
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Usage in API routes
export async function POST(request: Request) {
  try {
    // ... logic
  } catch (error) {
    captureError(error as Error, {
      component: 'api/workflows/execute',
      action: 'execute_workflow',
      workflowId: params.id,
    });
    throw error;
  }
}
```

### 1.5 User Context

```typescript
// Set user context for better error reports
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Clear on logout
Sentry.setUser(null);
```

---

## 2. PERFORMANCE MONITORING

### 2.1 Core Web Vitals

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

### 2.2 Custom Performance Metrics

```typescript
// lib/performance.ts
import * as Sentry from '@sentry/nextjs';

export function measurePerformance(name: string, fn: () => Promise<any>) {
  return Sentry.startSpan({ name, op: 'function' }, async (span) => {
    const start = performance.now();
    try {
      const result = await fn();
      span?.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span?.setStatus({ code: 2, message: error.message }); // ERROR
      throw error;
    } finally {
      const duration = performance.now() - start;
      span?.setData('duration_ms', duration);
    }
  });
}

// Usage
const result = await measurePerformance('execute_workflow', async () => {
  return engine.execute({ input });
});
```

### 2.3 API Response Time Tracking

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  const duration = Date.now() - start;
  response.headers.set('X-Response-Time', `${duration}ms`);
  
  // Log slow requests
  if (duration > 1000) {
    console.warn('[SLOW REQUEST]', {
      url: request.url,
      duration,
    });
  }
  
  return response;
}
```

### 2.4 Database Query Monitoring

```typescript
// lib/supabase/server.ts
import * as Sentry from '@sentry/nextjs';

export async function queryWithSpan<T>(
  name: string,
  query: () => Promise<{ data: T; error: any }>
): Promise<T> {
  return Sentry.startSpan({ name, op: 'db.query' }, async (span) => {
    const { data, error } = await query();
    
    if (error) {
      span?.setStatus({ code: 2, message: error.message });
      throw error;
    }
    
    span?.setStatus({ code: 1 });
    return data;
  });
}

// Usage
const agents = await queryWithSpan('get_agents', () =>
  supabase.from('agents').select('*').eq('status', 'approved')
);
```

---

## 3. LOGGING STRATEGY

### 3.1 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Unexpected errors | API failures, DB errors |
| `warn` | Potential issues | Slow queries, deprecated usage |
| `info` | Important events | User actions, workflow execution |
| `debug` | Development only | Variable values, flow tracing |

### 3.2 Structured Logging

```typescript
// lib/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  workflowId?: string;
  executionId?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Could send to Axiom, LogRocket, DataDog, etc.
      console[level](JSON.stringify(logEntry));
    } else {
      console[level](`[${level.toUpperCase()}]`, message, context);
    }
  }
  
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }
  
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    
    // Also report to Sentry
    if (error) {
      Sentry.captureException(error, { extra: context });
    }
  }
}

export const logger = new Logger();

// Usage
logger.info('Workflow execution started', {
  component: 'WorkflowEngine',
  action: 'execute',
  workflowId: 'wf-123',
  userId: 'user-456',
});

logger.error('Gmail API failed', error, {
  component: 'GmailExecutor',
  action: 'send_email',
  nodeId: 'gmail-1',
});
```

### 3.3 Request Logging

```typescript
// middleware.ts
import { logger } from '@/lib/logger';

export async function middleware(request: Request) {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  
  // Log incoming request
  logger.info('Request received', {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  });
  
  const response = NextResponse.next();
  
  // Log response
  logger.info('Request completed', {
    requestId,
    status: response.status,
    duration: Date.now() - start,
  });
  
  return response;
}
```

---

## 4. ANALYTICS

### 4.1 Vercel Analytics

```typescript
// Already included via @vercel/analytics
// Tracks page views, web vitals automatically
```

### 4.2 Custom Events

```typescript
// lib/analytics.ts
import { track } from '@vercel/analytics';

export const analytics = {
  // User events
  signUp: (method: string) => track('sign_up', { method }),
  signIn: (method: string) => track('sign_in', { method }),
  
  // Agent events
  viewAgent: (agentId: string, category: string) => 
    track('view_agent', { agentId, category }),
  purchaseAgent: (agentId: string, price: number) => 
    track('purchase_agent', { agentId, price }),
  executeAgent: (agentId: string) => 
    track('execute_agent', { agentId }),
  
  // Workflow events
  createWorkflow: () => track('create_workflow'),
  publishWorkflow: (workflowId: string) => 
    track('publish_workflow', { workflowId }),
  
  // Developer events
  viewEarnings: () => track('view_earnings'),
  requestPayout: (amount: number) => 
    track('request_payout', { amount }),
};

// Usage
analytics.purchaseAgent('agent-123', 999);
```

### 4.3 User Properties

```typescript
// Set user properties for segmentation
import { identify } from '@vercel/analytics';

identify({
  userId: user.id,
  role: user.role,
  plan: user.subscription?.plan,
  agentsPurchased: user.purchases_count,
});
```

---

## 5. ALERTING

### 5.1 Sentry Alerts

```yaml
# Configure in Sentry dashboard
Alerts:
  - name: High Error Rate
    condition: Error rate > 5% in 5 minutes
    action: Slack notification

  - name: Critical Error
    condition: Error tagged as critical
    action: PagerDuty + Slack

  - name: Performance Degradation
    condition: P95 latency > 3s
    action: Slack notification
```

### 5.2 Uptime Monitoring

```typescript
// Use Vercel's built-in monitoring or add custom
// pages/api/health.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    stripe: await checkStripe(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'healthy');
  
  return Response.json(
    { status: healthy ? 'healthy' : 'unhealthy', checks },
    { status: healthy ? 200 : 503 }
  );
}

async function checkDatabase() {
  try {
    await supabase.from('users').select('count').limit(1);
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### 5.3 Custom Alerts

```typescript
// lib/alerts.ts

export async function sendAlert(type: string, message: string, data?: any) {
  // Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *${type}*: ${message}`,
        attachments: data ? [{ text: JSON.stringify(data, null, 2) }] : [],
      }),
    });
  }
}

// Usage
if (failedExecutions > 10) {
  await sendAlert('High Failure Rate', 'Workflow executions failing at high rate', {
    failedCount: failedExecutions,
    timeWindow: '5 minutes',
  });
}
```

---

## 📋 ENVIRONMENT VARIABLES

```bash
# .env.local

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Vercel Analytics (auto-configured on Vercel)
# No config needed

# Logging (optional - for external service)
AXIOM_TOKEN=xxx
AXIOM_ORG_ID=xxx

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

---

## 📊 DASHBOARD

### Recommended Dashboards

| Tool | Purpose | Cost |
|------|---------|------|
| **Sentry** | Errors, Performance | Free tier generous |
| **Vercel Analytics** | Web Vitals, Traffic | Free on Pro |
| **Uptime Robot** | Uptime monitoring | Free tier |
| **Axiom** | Logs, Custom metrics | Free tier |

---

## 📋 MONITORING CHECKLIST

```markdown
## Setup
[ ] Install @sentry/nextjs
[ ] Configure Sentry DSN
[ ] Add error boundary components
[ ] Enable Vercel Analytics
[ ] Setup health check endpoint


## Ongoing
[ ] Review Sentry errors weekly
[ ] Check Core Web Vitals monthly
[ ] Monitor API response times
[ ] Track execution success rates
[ ] Review alert thresholds quarterly
```
