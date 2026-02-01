---
inclusion: always
---

# 🗄️ Database Guide - VieAgent.vn v2 (Hybrid)

## 📊 Core Tables

### 1. users
Standard Supabase Auth profile.
```sql
id UUID PRIMARY KEY
email VARCHAR UNIQUE
role VARCHAR(20)  -- 'customer', 'developer', 'admin'
full_name VARCHAR
stripe_customer_id VARCHAR
created_at TIMESTAMPTZ
```

### 2. agents
Represents a sellable AI tool.
```sql
id UUID PRIMARY KEY
name VARCHAR(200)
description TEXT
price INTEGER  -- in cents
status VARCHAR(20)  -- 'published', 'draft'
engine VARCHAR(20) -- 'flowise' | 'activepieces'
engine_id VARCHAR  -- The external ID (e.g. Flowise Chatflow ID)
input_schema JSONB  -- UI Definition: [{name: "url", type: "text"}]
created_at TIMESTAMPTZ
```

### 3. credentials (The Vault)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
key_name VARCHAR(100) -- Alias (e.g. "My Pro Key")
provider VARCHAR(50)  -- 'openai', 'gemini'
encrypted_value TEXT  -- AES-256 Encrypted
iv TEXT              -- Initialization Vector
created_at TIMESTAMPTZ
```

### 4. workflow_executions (Shadow Logs)
Tracks usage for billing/history. Logic is external.
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
agent_id UUID REFERENCES agents(id)
status VARCHAR(20)  -- 'pending', 'success', 'failed'
external_execution_id VARCHAR -- ID from Flowise/AP
input_snapshot JSONB
output_snapshot JSONB
error_message TEXT
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
duration_ms INTEGER
```

## 🔒 RLS Policies (Critical)

1.  **Credentials**: `SELECT` using `auth.uid()`. NEVER `SELECT *`.
2.  **Executions**: Users view their own. Admins view all.

## ⚠️ Important Rules

1.  **No Node Storage**: We do NOT store nodes/edges in Postgres anymore. That is Flowise's job.
2.  **Encrypted Always**: `credentials` table columns MUST be encrypted.
3.  **Snake Case**: DB columns are `snake_case`. JS is `camelCase`.
