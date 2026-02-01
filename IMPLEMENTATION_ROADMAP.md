# 🗺️ Implementation Roadmap: VieAgent V2 (Admin-Driven)

This document outlines the step-by-step plan to rebuild VieAgent using the **Hybrid Architecture**, reusing 90% of the existing `reference-components`.

**Core Changes:**
-   ❌ **NO Developer Role**: Only **Admins** add agents (Templates). Users are purely Customers.
-   🔑 **Multi-Provider Vault**: Support OpenAI, Gemini, DeepSeek, Anthropic, etc.
-   🚀 **Reuse Strategy**: Maximizing usage of `reference-components`.

---

## 📅 Phase 1: Foundation & Vault (The Core)
**Goal**: Project setup, Authentication, and the Secure Key Vault.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. Init Project** | N/A | `npx create-next-app` (Next 14, Shadcn, Tailwind) |
| **2. Auth System** | `app/(auth)/*` (Old Project) | Setup Supabase Auth (Login/Signup). Remove "Developer" role choice. |
| **3. Clean Layout** | `Sidebar.tsx`, `Header.tsx` | Build standard Dashboard layout. |
| **4. Credential Vault** | `CredentialManager.tsx` | **HEAVY REUSE**. Adapt to support dropdown for Provider (OpenAI/Gemini/DeepSeek). <br>Encryption logic must be moved to Server Actions. |

### 🔑 Vault Supported Keys:
-   **OpenAI** (`sk-...`)
-   **Google Gemini** (API Key)
-   **DeepSeek** (API Key)
-   **Anthropic** (Claude)
-   *(Extendable to Search APIs like Tavily, Serper)*

---

## 📅 Phase 2: The Form Engine ("Easy Mode")
**Goal**: The "Run Agent" interface. This replaces the old "Workflow Builder".

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. UI Engine** | `DynamicFormBuilder.tsx` | **CRITICAL REUSE**. This component already renders forms from JSON. <br>Refactor to accept Flowise `input_schema`. |
| **2. Execution UI** | `ExecutionStatusPanel.tsx` | Reuse the "Logs/Console" UI. Connect to `GET /api/execute/status`. |
| **3. History** | `ExecutionHistoryTable` | Reuse table visualization for past runs. |

---

## 📅 Phase 3: Marketplace (Public Store)
**Goal**: Where users browse and buy Agents.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. Storefront** | `EnhancedAgentMarketplace.tsx` | **Keep UI**. Remove "Created by [Dev]" badge. Replace with "Official Agent". |
| **2. Agent Detail** | `AgentDetailModal` | Reuse info layout (Pricing, Description). |
| **3. Checkout** | `AdvancedBillingSystem.tsx` | Reuse Stripe implementation. Users buy "Credits" or "Subscription". |

---

## 📅 Phase 4: Customer Workspace (The Dashboard)
**Goal**: The "My Apps" area where customers manage and use their agents.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. My Agents** | `EnhancedAgentMarketplace.tsx` | Reuse Grid UI but filter by `purchase_receipts` (User's owned agents). |
| **2. Run Interface** | `ExecutionPage.tsx` | Full-page wrapper for the **Form Engine**. Includes "History Sidebar". |
| **3. Usage & Billing** | `AdvancedBillingSystem.tsx` | **CRITICAL**: Adapt to show "My Subscriptions" (Agent-specific) and "One-Time Purchases".<br>Reuse `UsageAnalytics` for API call tracking. |
| **4. Wallet/Cards** | `PaymentMethodsManager` (in Billing) | Allow users to save cards for 1-click buying. |

---

## 📅 Phase 5: Admin Portal (The Control Center)
**Goal**: Where YOU (The Admin) manage everything.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. Agent Manager** | `AgentCreationWizard.tsx` | **CRITICAL**: Enable `price_one_time` and `price_monthly` fields.<br>Use logic for "Integration Requirements" to map Vault keys. |
| **2. Billing Admin** | `BillingManagementTab.tsx` | View Total Revenue (Sub + One-time). |
| **3. User Manager** | `UserDetailModal.tsx` | View/Block users. |
| **4. System Health** | `SystemMonitoringTab.tsx` | Monitor Flowise API health. |

---

## 📅 Phase 6: Landing Page & Marketing (✅ DONE)
**Goal**: Public facing website.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. Landing Home** | N/A (New Code) | Hero section: "Hire AI Employees, Don't Build Them". (Implemented in `hero.tsx`) |
| **2. Use Cases** | N/A | Showcase Top Agents (Sales, Data, SEO). |
| **3. Trust** | `RatingsReviewsSystem.tsx` | Show 5-star reviews on homepage. |

---

## 📅 Phase 4.5: UI/UX Polish (Premium & WOW Factor)
**Goal**: Elevate the design to "State of the Art" (Glassmorphism, Animations).

| Task | Action |
| :--- | :--- |
| **1. Glass Sidebar** | Update `dashboard/layout.tsx` to use floating, frosted glass sidebar. |
| **2. Dynamic Backgrounds** | Add mesh gradients or subtle animated blobs to `globals.css` / layouts. |
| **3. Motion** | Ensure `Framer Motion` is used for page transitions and card hover effects. |

---

## � Phase 7: Core Execution Engine (Flowise Integration)
**Goal**: Connect the "Run Agent" UI to the actual Flowise API to process AI requests.

| Task | Component to Reuse/Reference | Action |
| :--- | :--- | :--- |
| **1. Flowise Adapter** | N/A | Create `lib/engines/flowise.ts` to handle `POST /api/v1/prediction`. Support Streaming & JSON. |
| **2. Credential Injection** | `CredentialManager.tsx` | Decrypt user's Vault keys (AES-256) server-side and inject into Flowise `overrideConfig`. |
| **3. ActivePieces Adapter** | N/A | (Optional) Create `lib/engines/activepieces.ts` for automation flows. |
| **4. Response UI** | `ChatInterface.tsx` | Update `DynamicForm` to render markdown/streaming response from server action. |

---

## �📝 Integration Logic (Flowise <-> VieAgent)
Instead of Users "Developing", you will:
1.  Go to Flowise (localhost:3000).
2.  Build/Test a flow (e.g. "Gemini Article Writer").
3.  Export JSON.
4.  Go to VieAgent Admin -> "Import Agent".
5.  Upload JSON. VieAgent extracts `{{Gemini_Key}}` and `{{Topic}}`.
6.  Publish -> User sees "Gemini Writer" in Marketplace.

---

