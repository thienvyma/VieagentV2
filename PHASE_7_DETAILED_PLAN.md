# 🚀 Phase 7: Core Execution Engine - Detailed Implementation Plan

**Status**: 🚧 IN PROGRESS (Phase 6 ✅ COMPLETED)

**Goal**: Implement the "Hybrid Engine" core. This bridges the **VieAgent Marketplace** (User View) with the **Flowise Engine** (Builder View), enabling users to execute complex, n8n-style workflows securely.

---

## 📊 Current State Assessment

### ✅ What's Working (Phase 6 Completed)
- Landing page with premium animations
- Authentication system (Supabase)
- Dashboard with glassmorphism design
- Marketplace basic display
- Credential Vault (add/list credentials)
- Dynamic Form Engine (renders forms from schema)
- Admin portal structure

### ❌ What's Missing (Phase 7 Critical)
- **NO execution bridge**: UI cannot talk to Flowise.
- **NO secure injection**: Credentials sit in Vault but can't be used.
- **NO real-time feedback**: Users can't see the "Thinking..." or streaming steps of a complex flow.

---

## 🎯 Phase 7 Objectives (The "Hybrid" Realization)

### Core Deliverables
1.  ✅ **The Bridge (Adapter)**: A robust `FlowiseClient` that talks to your Flowise instance.
2.  ✅ **The Security (Injection)**: Just-in-time decryption of API Keys from Vault -> Flowise RAM.
3.  ✅ **The Experience (Streaming)**: Real-time UI updates so users feel the "Magic" of the AI working.
4.  ✅ **The History (Logs)**: Full audit trail of what agent ran, when, and cost.

### Strategic Alignment
- **Builder**: We assume Admins use Flowise (n8n-style drag & drop) to create flows.
- **Runner**: VieAgent acts purely as the secure runner and billing interface.

---

## 📋 Implementation Tasks

### 7.1 Backend Infrastructure (Week 1)

#### Task 7.1.1: Flowise Adapter
**File**: `vieagent-app/lib/engines/flowise.ts`

**Priority**: 🔴 CRITICAL

**Requirements**:
```typescript
export class FlowiseClient {
  // Execute a workflow with credential injection
  async executeWorkflow(params: {
    flowId: string;
    inputs: Record<string, any>;
    credentials: Record<string, string>; // Decrypted keys
    streaming?: boolean;
  }): Promise<ExecutionResult>

  // Get execution status
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus>

  // Stream handler for real-time responses
  async streamExecution(
    flowId: string,
    inputs: Record<string, any>,
    onChunk: (chunk: string) => void
  ): Promise<void>
}
```

**Implementation Notes**:
- Use `fetch` with Flowise API endpoint
- Handle `overrideConfig` for credential injection
- Support both streaming and JSON responses
- Implement retry logic for transient failures
- Add timeout handling (max 5 minutes)

**Reference**: `docs_v2/API.md`, `docs_v2/ARCHITECTURE_V2.md`

---

#### Task 7.1.2: Execution API Route
**File**: `vieagent-app/app/api/execute/[agentId]/route.ts`

**Priority**: 🔴 CRITICAL

**Flow**:
```
1. Validate user authentication
2. Check user owns/purchased the agent
3. Fetch agent config (engine_flow_id, required_credential_types)
4. Fetch user's credentials from Vault
5. Decrypt credentials (AES-256)
6. Call FlowiseClient.executeWorkflow()
7. Create shadow log in execution_logs table
8. Return execution ID + status
```

**API Contract**:
```typescript
// POST /api/execute/[agentId]
Request: {
  inputs: Record<string, any>;
  credential_ids: Record<string, string>; // Map provider -> credential_id
}

Response: {
  success: boolean;
  execution_id: string;
  status: 'pending' | 'running';
  message?: string;
}
```

**Security Checklist**:
- ✅ Verify user owns agent
- ✅ Decrypt credentials server-side only
- ✅ Never log decrypted keys
- ✅ Use RLS policies for execution_logs

---

#### Task 7.1.3: Status Polling API
**File**: `vieagent-app/app/api/execute/status/[executionId]/route.ts`

**Priority**: 🟡 MEDIUM

**Purpose**: Allow frontend to poll for execution status updates

**API Contract**:
```typescript
// GET /api/execute/status/[executionId]
Response: {
  success: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  error?: string;
  duration_ms?: number;
  created_at: string;
  completed_at?: string;
}
```

**Implementation**:
- Query `execution_logs` table
- If status is 'running', optionally poll Flowise for latest status
- Return cached result if completed/failed

---

#### Task 7.1.4: Webhook Handler (Optional)
**File**: `vieagent-app/app/api/webhooks/flowise/route.ts`

**Priority**: 🟢 LOW (Can be added later)

**Purpose**: Receive completion callbacks from Flowise instead of polling

---

### 7.2 Frontend Execution UI (Week 2)

#### Task 7.2.1: Streaming Response Display
**File**: `vieagent-app/components/business/forms/dynamic-form.tsx`

**Priority**: 🔴 HIGH

**Changes Needed**:
```typescript
// Add state for execution
const [isExecuting, setIsExecuting] = useState(false);
const [executionId, setExecutionId] = useState<string | null>(null);
const [streamingOutput, setStreamingOutput] = useState<string>('');
const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

// Update onSubmit to handle execution
async function handleSubmit(data: Record<string, unknown>) {
  setIsExecuting(true);
  setExecutionStatus('running');
  
  try {
    // Call execution API
    const response = await fetch(`/api/execute/${agentId}`, {
      method: 'POST',
      body: JSON.stringify({ inputs: data, credential_ids: {...} })
    });
    
    const result = await response.json();
    setExecutionId(result.execution_id);
    
    // Start polling for status
    pollExecutionStatus(result.execution_id);
  } catch (error) {
    setExecutionStatus('failed');
  }
}

// Poll for status updates
async function pollExecutionStatus(executionId: string) {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/execute/status/${executionId}`);
    const status = await response.json();
    
    if (status.status === 'completed') {
      setStreamingOutput(status.output);
      setExecutionStatus('completed');
      clearInterval(interval);
    } else if (status.status === 'failed') {
      setExecutionStatus('failed');
      clearInterval(interval);
    }
  }, 2000); // Poll every 2 seconds
}
```

**UI Components to Add**:
- Loading spinner during execution
- Real-time output display (markdown renderer)
- Progress indicator
- Error message display
- Success/failure badges

---

#### Task 7.2.2: Execution Status Panel
**File**: `vieagent-app/components/business/execution/execution-status-panel.tsx`

**Priority**: 🟡 MEDIUM

**Features**:
- Status badge (pending/running/completed/failed)
- Execution time counter
- Logs viewer (expandable)
- Download result button
- Re-run button

**Design Reference**: `reference-components/ExecutionStatusPanel.tsx`

---

#### Task 7.2.3: Execution History
**File**: `vieagent-app/app/[locale]/dashboard/history/page.tsx`

**Priority**: 🟡 MEDIUM

**Features**:
- Table of past executions
- Filter by agent, status, date
- View details modal
- Re-run with same inputs
- Export results

---

### 7.3 Testing & Validation (Week 3)

#### Task 7.3.1: Credential Testing
**File**: `vieagent-app/app/api/credentials/test/route.ts`

**Priority**: 🔴 HIGH

**Purpose**: Validate API keys before saving

**Implementation**:
```typescript
// POST /api/credentials/test
Request: {
  provider: 'openai' | 'gemini' | 'anthropic' | 'deepseek';
  api_key: string;
}

Response: {
  success: boolean;
  valid: boolean;
  message: string;
  details?: {
    account_name?: string;
    quota_remaining?: number;
  }
}
```

**Test Methods by Provider**:
- OpenAI: Call `/v1/models` endpoint
- Gemini: Call `generateContent` with simple prompt
- Anthropic: Call `/v1/messages` with test message
- DeepSeek: Similar to OpenAI

---

#### Task 7.3.2: End-to-End Integration Test

**Test Scenario**:
```
1. Admin creates test agent in Flowise
2. Admin imports agent to VieAgent
3. User signs up
4. User adds OpenAI key to Vault
5. User purchases/accesses agent
6. User fills form and runs agent
7. Backend decrypts key
8. Flowise executes with injected key
9. Result streams back to UI
10. Execution log is saved
```

**Success Criteria**:
- ✅ No errors in console
- ✅ Credentials never exposed to client
- ✅ Execution completes successfully
- ✅ Output is displayed correctly
- ✅ Log is saved in database

---

## 🔧 Technical Specifications

### Environment Variables Needed
```env
# Flowise Configuration
FLOWISE_API_URL=http://localhost:3000
FLOWISE_API_KEY=your-flowise-api-key

# ActivePieces (Optional)
ACTIVEPIECES_API_URL=http://localhost:8080
ACTIVEPIECES_API_KEY=your-activepieces-key

# Encryption Key (for Vault)
ENCRYPTION_KEY=your-32-byte-encryption-key
```

### Database Schema Updates
```sql
-- Add execution_logs table if not exists
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  external_execution_id TEXT, -- Flowise execution ID
  input_snapshot JSONB,
  output_snapshot JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  credits_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX idx_execution_logs_user_id ON execution_logs(user_id);
CREATE INDEX idx_execution_logs_agent_id ON execution_logs(agent_id);
CREATE INDEX idx_execution_logs_status ON execution_logs(status);
```

---

## 📚 Reference Materials

### Key Documentation
- `docs_v2/ARCHITECTURE_V2.md` - Hybrid architecture overview
- `docs_v2/FORM_ENGINE.md` - Dynamic form patterns
- `docs_v2/DATABASE.md` - Schema reference
- `docs_v2/API.md` - API specifications

### Reference Components
- `reference-components/DynamicFormBuilder.tsx` - Form patterns
- `reference-components/CredentialManager.tsx` - Vault UI patterns
- `reference-components/ExecutionStatusPanel.tsx` - Status display

### Flowise API Documentation
- Prediction API: `POST /api/v1/prediction/{chatflowId}`
- Override Config: How to inject credentials
- Streaming: Server-Sent Events (SSE) support

---

## 🎯 Success Metrics

### Phase 7 Complete When:
- [ ] User can successfully run an agent end-to-end
- [ ] Credentials are securely injected (never exposed to client)
- [ ] Real-time status updates work
- [ ] Execution history is saved and viewable
- [ ] Error handling is robust
- [ ] All tests pass

### Performance Targets:
- Execution start latency: < 2 seconds
- Status update frequency: Every 2 seconds
- Maximum execution time: 5 minutes (with timeout)
- Credential decryption: < 100ms

---

## 🚨 Critical Risks & Mitigations

### Risk 1: Credential Exposure
**Mitigation**: 
- Never send decrypted keys to client
- Use server-side only decryption
- Audit all API routes for key leakage

### Risk 2: Flowise Connection Failure
**Mitigation**:
- Implement retry logic (3 attempts)
- Add timeout handling
- Provide clear error messages to users

### Risk 3: Performance Issues
**Mitigation**:
- Use connection pooling
- Implement caching where appropriate
- Add rate limiting

---

## 📅 Timeline Estimate

**Week 1**: Backend infrastructure (Tasks 7.1.1 - 7.1.3)
**Week 2**: Frontend UI (Tasks 7.2.1 - 7.2.3)
**Week 3**: Testing & polish (Tasks 7.3.1 - 7.3.2)

**Total**: ~3 weeks for Phase 7 completion

---

## 🎉 Next Steps After Phase 7

Once Phase 7 is complete, we move to:
- **Phase 8**: Enhanced Marketplace (filters, search, reviews)
- **Phase 9**: Billing & Monetization (Stripe integration)
- **Phase 10**: Admin Tools (agent creation wizard, user management)
- **Phase 11**: Analytics & Monitoring
- **Phase 12**: Production deployment & optimization
