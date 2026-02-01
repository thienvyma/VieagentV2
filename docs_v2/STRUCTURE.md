# Project Structure (V2 Hybrid)

## 🏢 High-Level Structure

```
VieAgent-v2/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login/Signup
│   ├── (dashboard)/            # User Dashboard
│   ├── (marketplace)/          # Public Store
│   └── api/
│       ├── execute/            # Proxy API to Flowise/ActivePieces
│       ├── webhooks/           # Incoming Webhooks
│       └── ...
├── components/
│   ├── core/                   # Shared UI (ShadowCN)
│   ├── business/               # Business Logic Components
│   │   ├── marketplace/        # Agent Cards, Filters
│   │   ├── billing/            # Stripe, Credits
│   │   ├── vault/              # CredentialManager (CRITICAL)
│   │   └── builder/            # DynamicFormBuilder (Easy Mode)
│   └── admin/                  # Admin Panels
├── lib/
│   ├── engines/                # Engine Adapters
│   │   ├── flowise.ts          # Flowise API Client
│   │   └── activepieces.ts     # ActivePieces Client
│   ├── supabase/               # DB Client
│   └── utils.ts
├── types/                      # TypeScript Interfaces
└── ...
```

## 🔑 Key Directories for V2

### `lib/engines/` (New)
Contains the "Drivers" for our Hybrid Engines.
-   `flowise.ts`: Handles `executeWorkflow`, `getExecutionStatus`, `overrideConfig`.
-   `activepieces.ts`: Handles triggering automation webhooks.

### `components/business/vault/`
Reference: `CredentialManager.tsx`
-   Stores API Keys (encrypted).
-   UI for "Add Key", "Test Key".

### `components/business/builder/`
Reference: `DynamicFormBuilder.tsx`
-   **Easy Mode Form**: Renders inputs based on Agent Template Schema.
-   **Validation**: Zod schema generation at runtime.

### `docs/` (Refactoring)
-   `setup/` -> `flowise-setup.md`
-   `legacy/` -> `NODE_EXECUTORS.md`, `ADVANCED_NODES.md`
