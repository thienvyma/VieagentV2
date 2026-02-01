---
inclusion: always
---

# 🔄 Hybrid Engine Guide - VieAgent.vn v2

## 🎯 Overview

VieAgent V2 uses a **Hybrid Architecture**:
-   **Frontend**: Next.js App (VieAgent) handles UI, Billing, and User Management.
-   **Backend Logic**: **Flowise** or **ActivePieces** (External) handles the actual workflow execution.

> ❌ **DO NOT** build a React Flow node editor in this project.
> ❌ **DO NOT** implement local execution engines (nodes/edges).
> ✅ **DO** build "Easy Mode" Forms that trigger external flows.

## 🏗️ Architecture

```
User -> VieAgent Form -> API Proxy -> Flowise/ActivePieces -> Result
```

## 📦 Tech Stack

-   **Form Engine**: `react-hook-form` + `zod` (Dynamic Input Mapping)
-   **Execution**: REST API calls to external services.
-   **Logs**: Shadow logs stored in Supabase `workflow_executions` (metadata only).

## 🔌 Engine Interfaces

We use **Drivers** to communicate with external engines.

### 1. Flowise Driver (`lib/engines/flowise.ts`)
-   `executeWorkflow(flowId, inputs)`
-   `getExecutionStatus(executionId)`

### 2. ActivePieces Driver (`lib/engines/activepieces.ts`)
-   `triggerWebhook(webhookUrl, payload)`

## 📝 Form Mapping Strategy

Instead of dragging nodes, users fill a form defined by the Agent's `input_schema`.

| Flowise Variable | UI Component |
|------------------|--------------|
| `{{URL}}`        | Text Input   |
| `{{Tone}}`       | Select Box   |
| `{{OPENAI_KEY}}` | Vault Selector |

## ⚠️ IMPORTANT Rules

1.  **No Local State**: Do not try to maintain execution state locally. Trust the external engine.
2.  **Credential Injection**: Always use the Vault to decrypt keys at runtime and pass them to the engine. NEVER expose keys to the client.
3.  **Shadow Logging**: Always save a record of the execution in `workflow_executions` for billing/history purposes, even if the logic is external.
