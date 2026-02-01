# ⚡ CACHING & QUEUE STRATEGY - VieAgent.vn v2

**Mục tiêu**: Scale hệ thống từ 1K → 100K+ users

---

## 📋 MỤC LỤC

1. [Caching Strategy](#1-caching-strategy)
2. [Queue System](#2-queue-system)
3. [Rate Limiting](#3-rate-limiting)
4. [Implementation Guide](#4-implementation-guide)

---

## 1. CACHING STRATEGY

### 1.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        CACHING LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Browser Cache (Client)                                   │   │
│  │  - React Query cache (5min default)                       │   │
│  │  - LocalStorage for preferences                           │   │
│  │  - IndexedDB for offline data                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Edge Cache (Vercel / Cloudflare)                        │   │
│  │  - Static assets (1 year)                                │   │
│  │  - API responses (stale-while-revalidate)                │   │
│  │  - ISR pages (on-demand revalidation)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Application Cache (Redis/Upstash)                       │   │
│  │  - Session data                                           │   │
│  │  - Rate limit counters                                    │   │
│  │  - Frequently accessed data                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Database (Supabase PostgreSQL)                          │   │
│  │  - Persistent storage                                     │   │
│  │  - Connection pooling (PgBouncer)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 What to Cache

| Data | Cache Location | TTL | Invalidation |
|------|----------------|-----|--------------|
| Agent list (marketplace) | Edge + Redis | 5 min | On agent update |
| Agent detail | Edge + Redis | 10 min | On agent update |
| User profile | Redis | 30 min | On profile update |
| Workflow definitions | Redis | 5 min | On save |
| Execution results | Redis | 1 hour | Never |
| Rate limit counters | Redis | 1 min | Auto-expire |
| Session data | Redis | 24 hours | On logout |

### 1.3 Redis/Upstash Setup

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache helpers
export async function getCached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Fetch and cache
  const data = await fetcher();
  await redis.set(key, data, { ex: ttlSeconds });
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage example
export async function getAgent(id: string) {
  return getCached(
    `agent:${id}`,
    600, // 10 minutes
    () => supabase.from('agents').select('*').eq('id', id).single()
  );
}
```

### 1.4 React Query Cache

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// hooks/useAgents.ts
export function useAgents(options?: AgentQueryOptions) {
  return useQuery({
    queryKey: ['agents', options],
    queryFn: () => fetchAgents(options),
    staleTime: 5 * 60 * 1000,
  });
}

// Invalidate on mutation
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateAgent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', data.id] });
    },
  });
}
```

### 1.5 ISR (Incremental Static Regeneration)

```typescript
// app/agents/[id]/page.tsx
import { revalidatePath } from 'next/cache';

export async function generateStaticParams() {
  const agents = await getPublishedAgents();
  return agents.map((agent) => ({ id: agent.id }));
}

export default async function AgentPage({ params }: { params: { id: string } }) {
  const agent = await getAgent(params.id);
  return <AgentDetail agent={agent} />;
}

// Revalidate on demand
// app/api/revalidate/route.ts
export async function POST(request: Request) {
  const { path, secret } = await request.json();
  
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }
  
  revalidatePath(path);
  return Response.json({ revalidated: true });
}
```

---

## 2. QUEUE SYSTEM

### 2.1 When to Use Queues

| Use Case | Why Queue? |
|----------|------------|
| Workflow execution | May take 30s+ to complete |
| Email notifications | Don't block user request |
| Webhook retries | Retry failed requests |
| Report generation | CPU intensive |
| Analytics aggregation | Background processing |

### 2.2 Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         QUEUE SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐    ┌──────────────────────────────────────────┐   │
│  │   API    │───▶│          MESSAGE QUEUE                   │   │
│  │  Server  │    │  (Trigger.dev / Inngest / BullMQ)        │   │
│  └──────────┘    └──────────────────────────────────────────┘   │
│       │                         │                                │
│       │                         ▼                                │
│       │          ┌──────────────────────────────────────────┐   │
│       │          │           WORKERS                         │   │
│       │          │  ┌────────┐ ┌────────┐ ┌────────┐        │   │
│       │          │  │Worker 1│ │Worker 2│ │Worker 3│        │   │
│       │          │  └────────┘ └────────┘ └────────┘        │   │
│       │          └──────────────────────────────────────────┘   │
│       │                         │                                │
│       ▼                         ▼                                │
│  ┌──────────┐              ┌──────────┐                         │
│  │ Response │              │ Database │                         │
│  │ (Job ID) │              │ (Results)│                         │
│  └──────────┘              └──────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Trigger.dev Setup (Recommended)

```typescript
// trigger.config.ts
import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'VieAgent-ai',
  runtime: 'node',
  dirs: ['./jobs'],
});
```

```typescript
// jobs/execute-workflow.ts
import { task } from '@trigger.dev/sdk/v3';
import { WorkflowEngine } from '@/lib/workflow/engine';

export const executeWorkflowTask = task({
  id: 'execute-workflow',
  maxDuration: 300, // 5 minutes max
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: { workflowId: string; input: any; userId: string }) => {
    const { workflowId, input, userId } = payload;
    
    // Load workflow
    const workflow = await getWorkflow(workflowId);
    
    // Create execution record
    const execution = await createExecution({
      workflow_id: workflowId,
      user_id: userId,
      input,
      status: 'running',
    });
    
    try {
      // Execute workflow
      const engine = new WorkflowEngine(workflow);
      const result = await engine.execute({ input });
      
      // Update execution
      await updateExecution(execution.id, {
        status: 'completed',
        output: result,
        completed_at: new Date(),
      });
      
      return { success: true, executionId: execution.id };
    } catch (error) {
      await updateExecution(execution.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date(),
      });
      throw error;
    }
  },
});
```

```typescript
// API endpoint to trigger
// app/api/workflows/[id]/execute/route.ts
import { executeWorkflowTask } from '@/jobs/execute-workflow';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { input } = await request.json();
  const user = await getAuthUser();
  
  // Trigger async job
  const handle = await executeWorkflowTask.trigger({
    workflowId: params.id,
    input,
    userId: user.id,
  });
  
  // Return immediately with job ID
  return Response.json({
    success: true,
    data: {
      jobId: handle.id,
      status: 'queued',
    },
  });
}
```

### 2.4 Inngest Alternative

```typescript
// inngest/client.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({ id: 'VieAgent-ai' });

// inngest/functions/execute-workflow.ts
import { inngest } from '../client';

export const executeWorkflow = inngest.createFunction(
  { id: 'execute-workflow', retries: 3 },
  { event: 'workflow/execute' },
  async ({ event, step }) => {
    const { workflowId, input, userId } = event.data;
    
    // Step 1: Load workflow
    const workflow = await step.run('load-workflow', async () => {
      return getWorkflow(workflowId);
    });
    
    // Step 2: Execute each node
    const results: Record<string, any> = {};
    for (const node of workflow.nodes) {
      results[node.id] = await step.run(`execute-${node.id}`, async () => {
        return executeNode(node, results);
      });
    }
    
    // Step 3: Save results
    await step.run('save-results', async () => {
      return saveExecution(workflowId, userId, results);
    });
    
    return { success: true, results };
  }
);
```

### 2.5 BullMQ (Self-hosted)

```typescript
// lib/queue/bull.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Create queue
export const workflowQueue = new Queue('workflow-execution', { connection });

// Create worker
const worker = new Worker(
  'workflow-execution',
  async (job) => {
    const { workflowId, input, userId } = job.data;
    const engine = new WorkflowEngine(await getWorkflow(workflowId));
    return engine.execute({ input });
  },
  { connection, concurrency: 10 }
);

worker.on('completed', async (job, result) => {
  await updateExecution(job.data.executionId, {
    status: 'completed',
    output: result,
  });
});

worker.on('failed', async (job, error) => {
  await updateExecution(job.data.executionId, {
    status: 'failed',
    error_message: error.message,
  });
});
```

---

## 3. RATE LIMITING

### 3.1 Rate Limit Tiers

| User Type | Requests/min | Executions/day | Concurrent |
|-----------|--------------|----------------|------------|
| Free | 60 | 10 | 1 |
| Pro | 300 | 100 | 5 |
| Business | 1000 | 1000 | 20 |
| Enterprise | Unlimited | Unlimited | 100 |

### 3.2 Implementation with Upstash

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './cache/redis';

// Create rate limiters
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1m'), // 60 requests per minute
  analytics: true,
  prefix: 'ratelimit:api',
});

export const executionRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1d'), // 10 per day for free
  analytics: true,
  prefix: 'ratelimit:execution',
});

// Middleware
// middleware.ts
import { NextResponse } from 'next/server';
import { apiRateLimiter } from './lib/rate-limit';

export async function middleware(request: Request) {
  if (request.url.includes('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success, limit, remaining, reset } = await apiRateLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }
  
  return NextResponse.next();
}
```

### 3.3 User-specific Rate Limits

```typescript
// lib/rate-limit.ts
export async function checkExecutionLimit(userId: string, tier: string): Promise<boolean> {
  const limits: Record<string, number> = {
    free: 10,
    pro: 100,
    business: 1000,
    enterprise: Infinity,
  };
  
  const key = `execution:${userId}:${new Date().toISOString().split('T')[0]}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 86400); // 24 hours
  }
  
  return count <= limits[tier];
}
```

---

## 4. IMPLEMENTATION GUIDE

### 4.1 Phase 1: Basic Caching (Week 1)

```markdown
[ ] Install @upstash/redis
[ ] Create lib/cache/redis.ts
[ ] Add caching to getAgent()
[ ] Add caching to getAgents()
[ ] Setup React Query client
[ ] Add staleTime to queries
```

### 4.2 Phase 2: Rate Limiting (Week 2)

```markdown
[ ] Install @upstash/ratelimit
[ ] Create lib/rate-limit.ts
[ ] Add middleware for API rate limiting
[ ] Add execution rate limiting per user
[ ] Add rate limit headers to responses
```

### 4.3 Phase 3: Queue System (Week 3)

```markdown
[ ] Choose queue provider (Trigger.dev recommended)
[ ] Setup queue client
[ ] Create executeWorkflow job
[ ] Update API to use async execution
[ ] Add job status endpoint
[ ] Add retry logic
```

### 4.4 Phase 4: Edge Caching (Week 4)

```markdown
[ ] Configure Vercel edge caching
[ ] Add stale-while-revalidate headers
[ ] Setup ISR for agent pages
[ ] Add on-demand revalidation endpoint
[ ] Monitor cache hit rates
```

---

## 📋 ENVIRONMENT VARIABLES

```bash
# .env.local

# Upstash Redis (Caching + Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Trigger.dev (Queue)
TRIGGER_API_KEY=tr_xxx
TRIGGER_API_URL=https://api.trigger.dev

# Or Inngest
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# Revalidation
REVALIDATION_SECRET=your-secret-token
```

---

## 📊 MONITORING

```typescript
// Monitor cache hit rates
const cacheStats = await redis.get('cache:stats');
console.log('Cache hit rate:', cacheStats.hits / (cacheStats.hits + cacheStats.misses));

// Monitor queue health
const queueStats = await workflowQueue.getJobCounts();
console.log('Queue stats:', queueStats);
// { waiting: 10, active: 5, completed: 1000, failed: 2 }

// Monitor rate limits
const rateLimitStats = await apiRateLimiter.analytics.get('api');
console.log('Rate limit blocks:', rateLimitStats.blocked);
```
