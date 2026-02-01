---
trigger: always_on
---

# 📚 VieAgent.vn v2 - AI Coding Rules Index

> **Official V2 Rules Set**

## 🎯 Purpose

These rules enforce the **Hybrid Architecture** (VieAgent + Flowise/ActivePieces).

## 📖 Documentation Reference

All authoritative documentation is in `docs_v2/`.

| File | Purpose | Key Concept |
|------|---------|-------------|
| `ARCHITECTURE_V2.md` | System Overview | Hybrid Engine Model |
| `DATABASE.md` | Schema | Vault & Shadow Logs |
| `FORM_ENGINE.md` | UI Logic | "Easy Mode" Inputs |
| `API.md` | Backend | Execution Proxy |

## 🚀 Quick Start Checklist

### 1. Before Coding
- [ ] Read `docs_v2/ARCHITECTURE_V2.md` to understand the separation of concerns.
- [ ] Ensure you are NOT building a workflow editor (that is Flowise).
- [ ] Check `docs_v2/DATABASE.md` for V2 table names.

### 2. File Placement
- **Engine Logic** -> `lib/engines/`
- **Vault Logic** -> `lib/encryption.ts` / `components/business/vault/`
- **UI Components** -> `components/ui/` (Shadcn)

### 3. Coding Standards
- **Strict Types**: No `any`.
- **Server Actions**: Use for all data mutations.
- **Encryption**: NEVER log raw API keys.

## 📦 Tech Stack (V2)
- **Frontend**: Next.js 14, Tailwind, Shadcn/UI
- **Engines**: Flowise, ActivePieces (External)
- **Database**: Supabase
- **Secrets**: AES-256 Encryption (Server-Side)