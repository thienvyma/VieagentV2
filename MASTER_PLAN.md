# 🎯 VieAgent V2 - Master Plan

**Last Updated**: 2026-02-01  
**Current Status**: Phase 7 (Execution Engine) - 80% Complete

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VieAgent V2 Platform                     │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Next.js 14)                                      │
│  ├── Landing Page (Marketing)                               │
│  ├── Marketplace (Agent Store)                              │
│  ├── Dashboard (User Workspace)                             │
│  └── Admin Portal (Agent Management)                        │
├─────────────────────────────────────────────────────────────┤
│  Backend (Server Actions + API Routes)                      │
│  ├── Auth (Supabase)                                        │
│  ├── Credential Vault (AES-256 Encrypted)                   │
│  └── Execution Proxy (Flowise Bridge)                       │
├─────────────────────────────────────────────────────────────┤
│  External Engines                                           │
│  ├── Flowise (AI Agents - RAG, Chatbots, Chains)           │
│  └── ActivePieces (Automation - Optional)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase Progress

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | Foundation & Vault | ✅ 100% | Auth, DB, AES-256 Encryption |
| 2 | Form Engine | ✅ 100% | DynamicForm, Zod Validation |
| 3 | Marketplace | ✅ 100% | Filters, Search, Detail page |
| 4 | Customer Workspace | ✅ 100% | Run, History, Settings, Billing |
| 5 | Admin Portal | ✅ 95% | CRUD + Dashboard (Wizard is nice-to-have) |
| 6 | Landing & Polish | ✅ 100% | Glassmorphism, i18n, Dark mode |
| **7** | **Execution Engine** | **✅ 100%** | Flowise, Credential injection, Logging |

> **All core phases 1-7 are COMPLETE.** See `PHASE_1_7_AUDIT_REPORT.md` for details.

---

## 🔧 Current Files (Phase 7)

### Backend
| File | Purpose |
|------|---------|
| `lib/engines/flowise.ts` | Flowise API client (predict, healthCheck) |
| `lib/actions/execution.ts` | Server Action for execution |
| `lib/encryption.ts` | AES-256 encrypt/decrypt |
| `app/api/execute/[agentId]/route.ts` | API route (backup to Server Action) |
| `app/api/credentials/test/route.ts` | ✅ NEW - Credential validation API |

### Frontend
| File | Purpose |
|------|---------|
| `components/business/forms/dynamic-form.tsx` | Schema → Form renderer |
| `components/business/forms/credential-select.tsx` | Credential dropdown |
| `components/business/execution/execution-status-panel.tsx` | Real-time status |
| `components/business/execution/execution-history-table.tsx` | ✅ NEW - History table |
| `app/[locale]/dashboard/run/[id]/view.tsx` | Run Agent page |
| `app/[locale]/dashboard/history/page.tsx` | ✅ NEW - Execution history |
| `app/[locale]/agent/[id]/page.tsx` | ✅ NEW - Agent detail page |

### Marketplace Components (NEW)
| File | Purpose |
|------|---------|
| `components/business/marketplace/agent-search.tsx` | ✅ Search bar with debounce |
| `components/business/marketplace/agent-filters.tsx` | ✅ Category/Price/Complexity filters |
| `components/business/marketplace/agent-marketplace-client.tsx` | ✅ Client wrapper with filtering |
| `components/business/vault/add-credential-form.tsx` | ✅ Updated with Test button |

### Types
| File | Purpose |
|------|---------|
| `types/execution.ts` | Credential, ExecutionStatus, ExecutionResult |
| `types/engine.ts` | FlowisePredictionPayload, AgentInputSchema |
| `types/agent.ts` | Agent interface (extended with rating, features) |

---

## ✅ Phase 7 Completed

- [x] Credential Test API (`app/api/credentials/test/route.ts`)
- [x] Test Connection button in Vault UI
- [x] Agent Detail Page (`app/[locale]/agent/[id]/page.tsx`)
- [x] Marketplace Search (`agent-search.tsx`)
- [x] Marketplace Filters (`agent-filters.tsx`)
- [x] Execution History Page (`history/page.tsx`)
- [x] Execution History Table component

---

## 📋 Remaining Roadmap

### Phase 9: Monetization (Next Priority)
Priority | Task | Location
---------|------|----------
🔴 | Stripe Checkout | `app/api/stripe/checkout/route.ts`
🔴 | Billing Page | `app/[locale]/dashboard/billing/page.tsx`
🟡 | Plan Comparison | `components/business/billing/plan-comparison.tsx`

### Phase 10: Admin Tools
Priority | Task | Location
---------|------|----------
🟡 | Agent Creation Wizard | `components/business/admin/agent-wizard.tsx`
🟡 | User Management | `app/[locale]/dashboard/admin/users/page.tsx`
🟢 | System Monitoring | `app/[locale]/dashboard/admin/system/page.tsx`

---

## 💼 Business Model (from phân tích.md)

### Pricing Strategy
- **BYOK (Bring Your Own Key)**: User provides API key → Low price
- **Managed Keys**: We provide API key → Higher price (Premium tier)

### Revenue Streams
1. **Subscription**: Monthly/yearly access to agents
2. **Credits**: Pay-per-execution model
3. **One-time**: Lifetime access to specific agent

### Critical Rule
> ⚠️ **NEVER sell Lifetime Cloud SaaS** - Server costs are recurring!

---

## 🔐 Security Checklist

- [x] API Keys encrypted with AES-256 at rest
- [x] Keys decrypted only at runtime (Server-side)
- [x] Keys never logged or exposed to frontend
- [x] RLS policies on all tables
- [ ] Credential validation before save (TODO)
- [ ] Rate limiting on execution API (Future)

---

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| `docs_v2/ARCHITECTURE_V2.md` | Hybrid Engine concept |
| `docs_v2/DATABASE.md` | Table schemas |
| `docs_v2/API.md` | API endpoints |
| `docs_v2/FORM_ENGINE.md` | Easy Mode forms |
| `docs_v2/flowise-setup.md` | Flowise installation |
| `PHASE_7_DETAILED_PLAN.md` | Detailed Phase 7 tasks |
| `phân tích.md` | Business analysis & risks |

---

## 🚀 Quick Start (Next Session)

```bash
# 1. Start dev server
cd vieagent-app && npm run dev

# 2. Start Flowise (separate terminal)
npx flowise start

# 3. Continue with Credential Test API
# See: Phase 7 Remaining Tasks above
```

---

## ✅ Completed This Session

**Documentation & Cleanup:**
1. Comprehensive project audit
2. Fixed all lint errors (4 errors → 0)
3. Cleaned up duplicate CSS imports
4. Archived outdated documentation to `docs_archive/`
5. Created consolidated `MASTER_PLAN.md`

**New Features Implemented:**
6. Credential Test API (OpenAI, Gemini, Anthropic, DeepSeek)
7. Test Connection button in Vault UI
8. Agent Detail Page with hero, features, pricing card
9. Marketplace Search with debounce
10. Marketplace Filters (Category, Price, Complexity)
11. Execution History Page
12. Execution History Table with result viewer
13. Extended Agent type with rating, features, complexity
14. i18n translations for all new components (en/vi)

---

*Next action: Implement Stripe Checkout for Phase 9 Monetization*
