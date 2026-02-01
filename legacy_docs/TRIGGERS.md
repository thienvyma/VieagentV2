# 🔌 TRIGGERS - VieAgent.vn

**Mô tả**: Các loại trigger khởi động workflow

---

## 📋 MỤC LỤC

1. [Manual Trigger](#1-manual-trigger)
2. [Schedule Trigger (Cron)](#2-schedule-trigger-cron)
3. [Webhook Trigger](#3-webhook-trigger)
4. [Form Trigger](#4-form-trigger)

---

## 1. MANUAL TRIGGER

### Description
Workflow được trigger thủ công bởi user qua UI hoặc API.

### Config Schema
```typescript
interface ManualTriggerConfig {
  type: 'manual';
  inputSchema?: {
    fields: InputField[];
  };
}

interface InputField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox' | 'file';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: string }[]; // for select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}
```

### Output
```typescript
interface ManualTriggerOutput {
  triggeredAt: string;    // ISO timestamp
  triggeredBy: string;    // user ID
  input: Record<string, any>; // form values
}
```

### Implementation
```typescript
// lib/workflow/executors/triggers/manual.ts
export const manualTriggerExecutor: NodeExecutor<ManualTriggerConfig> = {
  type: 'trigger_manual',
  
  async execute(config, context) {
    return {
      triggeredAt: new Date().toISOString(),
      triggeredBy: context.userId,
      input: context.input,
    };
  },
};
```

---

## 2. SCHEDULE TRIGGER (CRON)

### Description
Workflow chạy tự động theo lịch trình.

### Config Schema
```typescript
interface ScheduleTriggerConfig {
  type: 'schedule';
  cron: string;            // Cron expression
  timezone: string;        // IANA timezone
  enabled: boolean;
}

// Cron Examples:
// "0 9 * * 1-5"  → 9 AM weekdays
// "0 0 * * *"    → Midnight daily
// "*/15 * * * *" → Every 15 minutes
// "0 0 1 * *"    → First day of month
```

### Output
```typescript
interface ScheduleTriggerOutput {
  triggeredAt: string;
  scheduledTime: string;
  timezone: string;
  cronExpression: string;
}
```

### Implementation
```typescript
// lib/workflow/executors/triggers/schedule.ts
export const scheduleTriggerExecutor: NodeExecutor<ScheduleTriggerConfig> = {
  type: 'trigger_schedule',
  
  async execute(config, context) {
    return {
      triggeredAt: new Date().toISOString(),
      scheduledTime: context.metadata?.scheduledTime,
      timezone: config.timezone,
      cronExpression: config.cron,
    };
  },
};
```

### Backend Scheduler
```typescript
// Sử dụng Vercel Cron Jobs hoặc Trigger.dev

// vercel.json
{
  "crons": [{
    "path": "/api/cron/run-scheduled-workflows",
    "schedule": "* * * * *"  // Check every minute
  }]
}

// app/api/cron/run-scheduled-workflows/route.ts
import { headers } from 'next/headers';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = headers().get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get workflows due to run
  const { data: workflows } = await supabase
    .from('workflows')
    .select('*')
    .eq('trigger_type', 'schedule')
    .eq('status', 'published');
  
  for (const workflow of workflows) {
    const shouldRun = checkCronMatch(workflow.trigger_config.cron);
    if (shouldRun) {
      await executeWorkflow(workflow.id, {});
    }
  }
  
  return new Response('OK');
}

// Cron parser utility
import { CronJob } from 'cron';

function checkCronMatch(cronExpression: string): boolean {
  const job = new CronJob(cronExpression, () => {});
  const nextDate = job.nextDate();
  const now = new Date();
  // Check if next run is within 1 minute
  return Math.abs(nextDate.getTime() - now.getTime()) < 60000;
}
```

### Database
```sql
-- Add to workflows table
ALTER TABLE workflows ADD COLUMN trigger_type VARCHAR(50);
ALTER TABLE workflows ADD COLUMN trigger_config JSONB;
ALTER TABLE workflows ADD COLUMN next_run_at TIMESTAMPTZ;

-- Index for scheduled workflows
CREATE INDEX idx_workflows_next_run ON workflows(next_run_at) 
WHERE trigger_type = 'schedule' AND status = 'published';
```

---

## 3. WEBHOOK TRIGGER

### Description
Workflow được trigger bởi external HTTP request.

### Config Schema
```typescript
interface WebhookTriggerConfig {
  type: 'webhook';
  method: 'GET' | 'POST' | 'PUT';
  authentication?: {
    type: 'none' | 'header' | 'basic' | 'query';
    headerName?: string;
    headerValue?: string;
    username?: string;
    password?: string;
    queryParam?: string;
    queryValue?: string;
  };
  responseMode: 'immediately' | 'on_complete';
  responseCode?: number;
  responseBody?: string;
}
```

### Output
```typescript
interface WebhookTriggerOutput {
  triggeredAt: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  ip: string;
}
```

### Implementation
```typescript
// app/api/webhooks/[workflowId]/route.ts
export async function POST(
  request: Request,
  { params }: { params: { workflowId: string } }
) {
  const workflow = await getWorkflow(params.workflowId);
  
  if (!workflow || workflow.trigger_type !== 'webhook') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  const config = workflow.trigger_config as WebhookTriggerConfig;
  
  // Validate authentication
  if (!validateAuth(request, config.authentication)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json().catch(() => ({}));
  const input = {
    triggeredAt: new Date().toISOString(),
    method: request.method,
    headers: Object.fromEntries(request.headers),
    query: Object.fromEntries(new URL(request.url).searchParams),
    body,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  };
  
  if (config.responseMode === 'immediately') {
    // Start execution in background
    executeWorkflow(workflow.id, input);
    return Response.json({ 
      success: true, 
      message: 'Workflow triggered' 
    });
  } else {
    // Wait for completion
    const result = await executeWorkflow(workflow.id, input);
    return Response.json(result, { status: config.responseCode || 200 });
  }
}
```

### Webhook URL Format
```
POST https://vieagent.vn/api/webhooks/{workflow_id}

Headers:
  Content-Type: application/json
  X-VieAgent-Secret: {secret_token}

Body:
  { "data": ... }
```

---

## 4. FORM TRIGGER (Manual Approval)

### Description
Workflow đợi user nhập form hoặc approve action.

### Config Schema
```typescript
interface FormTriggerConfig {
  type: 'form';
  formTitle: string;
  formDescription?: string;
  fields: InputField[];
  submitButtonText?: string;
  requiresApproval?: boolean;
  approvers?: string[]; // user IDs
  expiresIn?: number; // hours
}
```

### Output
```typescript
interface FormTriggerOutput {
  triggeredAt: string;
  submittedBy: string;
  formData: Record<string, any>;
  approvedBy?: string;
  approvedAt?: string;
}
```

### Database
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  execution_id UUID REFERENCES workflow_executions(id),
  form_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
  submitted_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Implementation Flow
```
1. Workflow reaches "Wait for Form" node
2. Execution pauses, saves state to DB
3. Email sent to approvers with form link
4. User fills form / approves
5. API receives submission
6. Execution resumes with form data
```

---

## 📊 TRIGGER COMPARISON

| Feature | Manual | Schedule | Webhook | Form |
|---------|--------|----------|---------|------|
| User initiated | ✅ | ❌ | ❌ | ✅ |
| Automated | ❌ | ✅ | ✅ | ❌ |
| External system | ❌ | ❌ | ✅ | ❌ |
| Input form | ✅ | ❌ | ❌ | ✅ |
| Approval flow | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 NODE COMPONENTS

### TriggerNode.tsx
```typescript
// components/workflow/nodes/TriggerNode.tsx
import { Handle, Position } from '@xyflow/react';
import { Clock, Webhook, Play, FileText } from 'lucide-react';

const triggerIcons = {
  manual: Play,
  schedule: Clock,
  webhook: Webhook,
  form: FileText,
};

export function TriggerNode({ data }: { data: TriggerNodeData }) {
  const Icon = triggerIcons[data.triggerType] || Play;
  
  return (
    <div className="trigger-node bg-green-500 text-white rounded-lg p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <span className="font-semibold">Trigger</span>
      </div>
      <div className="text-sm opacity-90">
        {data.triggerType === 'schedule' && data.config.cron}
        {data.triggerType === 'webhook' && 'Webhook endpoint'}
        {data.triggerType === 'manual' && 'Start manually'}
        {data.triggerType === 'form' && 'Form submission'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### TriggerConfigPanel.tsx
```typescript
// components/workflow/config/TriggerConfigPanel.tsx
export function TriggerConfigPanel({ node, onUpdate }: ConfigPanelProps) {
  const [triggerType, setTriggerType] = useState(node.data.triggerType);
  
  return (
    <div className="space-y-4">
      <Select
        label="Trigger Type"
        value={triggerType}
        onChange={setTriggerType}
        options={[
          { value: 'manual', label: 'Manual (UI/API)' },
          { value: 'schedule', label: 'Schedule (Cron)' },
          { value: 'webhook', label: 'Webhook (External)' },
          { value: 'form', label: 'Form Submission' },
        ]}
      />
      
      {triggerType === 'schedule' && (
        <CronInput 
          value={node.data.config.cron}
          onChange={(cron) => onUpdate({ config: { ...node.data.config, cron }})}
        />
      )}
      
      {triggerType === 'webhook' && (
        <WebhookConfig 
          config={node.data.config}
          onChange={(config) => onUpdate({ config })}
        />
      )}
      
      {/* More config for each type */}
    </div>
  );
}
```

---

## ⚠️ IMPORTANT NOTES

1. **Schedule triggers** cần backend scheduler (Vercel Cron hoặc Trigger.dev)
2. **Webhook triggers** cần unique URL per workflow
3. **Form triggers** cần email service để notify approvers
4. Tất cả triggers đều output `triggeredAt` timestamp để workflow biết khi nào bắt đầu
