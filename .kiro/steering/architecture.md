---
inclusion: always
---

# 🏗️ Project Architecture - VieAgent.vn v2 (Hybrid Engine)

## 📁 Folder Structure (V2)

```
vieagent-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   ├── (dashboard)/              # User Dashboard
│   │   ├── credentials/          # Vault UI
│   │   ├── history/              # Execution Logs
│   │   └── settings/             # User Settings
│   ├── (marketplace)/            # Public Store
│   │   ├── agent/[id]/           # Agent Detail
│   │   └── ...
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth Handlers
│   │   ├── execute/              # Proxy to Flowise/AP (CRITICAL)
│   │   ├── webhooks/             # Incoming from Engines
│   │   └── credentials/          # Vault Actions
│   │
├── components/                   # React Components
│   ├── ui/                       # Shadcn UI (core)
│   ├── layout/                   # Navbar, Sidebar, Footer
│   ├── business/                 # Domain-Specific Components
│   │   ├── vault/                # Credential Management
│   │   ├── forms/                # Dynamic Form Engine (Easy Mode)
│   │   └── marketplace/          # Agent Cards, Filters
│   │
├── lib/                          # Utilities
│   ├── engines/                  # Engine Drivers (V2)
│   │   ├── flowise.ts            # Flowise Client
│   │   └── activepieces.ts       # ActivePieces Client
│   ├── supabase/                 # Database
│   ├── encryption.ts             # Vault Logic
│   └── utils.ts                  # Helpers
│
├── types/                        # TypeScript types
│   ├── database.ts               # Generated from Supabase
│   ├── engine.ts                 # Engine Interfaces
│   └── index.ts
│
├── constants/                    # Shared constants
│   ├── index.ts
│   ├── routes.ts
│   └── ...
│
└── supabase/
    └── migrations/               # V2 Schema
```

## 🔑 Key Patterns (V2)

### 1. Hybrid Engine Pattern
- **Logic**: Logic resides in **EXTERNAL** engines (Flowise/ActivePieces).
- **VieAgent Role**: Orchestrator, UI Layer, and Billing.
- **Form Engine**: We do NOT build workflows in VieAgent. We render **Input Forms** based on the Engine's schema.

### 2. Credential Injection
- **Storage**: Keys stored encrypted in `credentials` table.
- **Runtime**: Decrypted ONLY at runtime in `api/execute`.
- **Injection**: Passed to Engine via ephemeral config overrides.

### 3. Database Tables (V2)
```
Core: users, agents (products), credentials (vault)
Logs: execution_logs (shadow record of engine runs)
Commerce: purchases, subscriptions
```

## ⚠️ CRITICAL RULES

1.  **NO Internal Workflow Engine**: Do not create nodes, edges, or workflow builders in this codebase.
2.  **Proxy Execution**: All execution requests MUST go through `api/execute` to handle billing and key injection.
3.  **Strict Types**: Use `types/engine.ts` for Flowise/ActivePieces payloads.
