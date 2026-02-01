# API Endpoints - VieAgent.vn v2 (Hybrid Architecture)

## 🔐 Authentication APIs
*(Unchanged - Managed by Supabase Auth)*
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`

## 🤖 Agent APIs (Marketplace)
*(Unchanged)*
- `GET /api/agents` (Search, Filter)
- `GET /api/agents/[id]`
- `POST /api/agents` (Developer creates draft)

## ▶️ Execution APIs (The Relay Layer)
**KEY CHANGE**: Instead of running internal code, these APIs are **Proxies** to Flowise/ActivePieces.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/execute/proxy/[agentId]` | Trigger execution. Backend injects credentials & calls Engine. | ✅ |
| GET | `/api/execute/status/[executionId]` | Get status from DB (synced from Engine). | ✅ |
| GET | `/api/execute/logs/[executionId]` | Get full logs (from Engine API). | ✅ |

### Request Body (Easy Mode Form)
```json
{
  "inputs": {
    "url": "https://example.com",
    "question": "Summarize this"
  },
  "credential_ids": {
    "openai": "uuid-of-user-credential",
    "google": "uuid-of-user-credential"
  }
}
```

## 🔑 Credentials APIs (The Vault)
**CRITICAL FOR V2**: Manages user keys for injection.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vault/keys` | List my stored keys (masked) | ✅ |
| POST | `/api/vault/keys` | Add new key (Encrypted at rest) | ✅ |
| POST | `/api/vault/keys/[id]/test` | Test key validity | ✅ |

## 💳 Billing APIs
*(Unchanged - Stripe Integration)*
- `POST /api/billing/purchase`
- `POST /api/billing/subscription`

## 👑 Admin APIs
*(Unchanged)*
- `GET /api/admin/users`
- `POST /api/admin/approve-agent`
