# Database Schema - VieAgent.vn v2 (Hybrid)

## 📊 Core Tables

### 1. users
*(Unchanged)*: Stores basic user info, role, plan.

### 2. agents (Updated)
Products listed on the marketplace.
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  
  -- Engine Mapping (V2)
  engine_type TEXT CHECK (engine_type IN ('flowise', 'activepieces')),
  engine_flow_id TEXT, -- ID of the flow in the Engine (e.g. Flowise Chatflow ID)
  
  -- Easy Mode Configuration
  input_schema JSONB, -- Defines the Form UI (generated from Engine variables)
  required_credential_types TEXT[], -- e.g. ['openai', 'google_sheets']
  
  -- Marketplace info
  price_one_time DECIMAL(10,2),
  price_monthly DECIMAL(10,2),
  status TEXT DEFAULT 'draft'
);
```

### 3. credentials (The Vault)
**CRITICAL**: Stores keys encrypted.
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  provider TEXT, -- 'openai', 'google', 'anthropic'
  key_name TEXT,
  encrypted_value TEXT NOT NULL, -- AES-256 encrypted
  iv TEXT NOT NULL, -- Initialization Vector
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. execution_logs (The Shadow Journal)
Since execution happens externally (Flowise), we keep a **Shadow Record** here for billing/history.
```sql
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  
  -- Status sync
  status TEXT DEFAULT 'pending', -- pending -> running -> success/failed
  external_execution_id TEXT, -- ID from Flowise/ActivePieces
  
  -- Data snapshot
  input_snapshot JSONB,
  output_snapshot JSONB,
  
  -- Metrics
  duration_ms INTEGER,
  credits_consumed INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🗑 REMOVED TABLES (Legacy)
-   `workflows` (Code logic is now in Flowise)
-   `workflow_executions` (Replaced by `execution_logs`)
-   `workflow_nodes`
-   `workflow_edges`
