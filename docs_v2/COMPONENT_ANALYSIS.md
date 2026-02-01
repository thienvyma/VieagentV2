# Component Analysis & Migration Strategy (V2)

## 🎯 Summary
We are pivoting to a **Hybrid Architecture** (Flowise/ActivePieces).
-   **Core Platform Components** (Auth, Billing, Marketplace, Logs) are **KEPT** (90% reuse).
-   **Workflow Engine Components** (Node Graph, Custom Executors) are **REPLACED** by Flowise/ActivePieces.

## 🟢 KEEP (Direct Reuse with Minor Adapters)
These components form the backbone of the "Platform" and are engine-agnostic.

| Component | Status | V2 Role |
| :--- | :--- | :--- |
| `EnhancedAgentMarketplace.tsx` | **KEEP** | Main Storefront for AI Agents. |
| `DynamicFormBuilder.tsx` | **CRITICAL** | The core of **Easy Mode**. Renders Form Input -> Maps to Flowise Variables. |
| `CredentialManager.tsx` | **CRITICAL** | **Credential Vault**. Stores User API Keys securely. |
| `ExecutionStatusPanel.tsx` | **KEEP** | Shows logs. *Change*: Fetch logs from Flowise API instead of local DB. |
| `SystemMonitoringTab.tsx` | **KEEP** | System health dashboard. |
| `BillingManagementTab.tsx` | **KEEP** | Monetization & Payouts. |
| `Reference: ContentModeration, FraudDetection, SupportTickets` | **KEEP** | Admin features are unchanged. |
| `RatingsReviewsSystem.tsx` | **KEEP** | Community trust system. |
| `UserDetailModal.tsx` | **KEEP** | User management. |

## 🟡 MODIFY (Adapt for Flowise/ActivePieces)
These components need logic updates to talk to the new Engines.

| Component | Logic Change |
| :--- | :--- |
| `AgentCreationWizard.tsx` | **High**. Remove "Build Graph" step. Add "Select Template" & "Map Inputs" step. |
| `WebhookTestingPanel.tsx` | **Medium**. Point to Flowise Prediction API instead of generic webhook. |
| `SDKGeneratorDashboard.tsx` | **Low**. Generate SDKs that call VieAgent Proxy API (which calls Flowise). |

## 🔴 DEPRECATE (Legacy Custom Engine)
Logic related to building a custom React Flow engine is no longer needed.

| Feature | Reason | Alternative |
| :--- | :--- | :--- |
| `NODE_EXECUTORS.md` | logic handled by Flowise | Flowise Nodes |
| `ADVANCED_NODES.md` | logic handled by Flowise | Flowise Logic |
| `TRIGGERS.md` (Custom) | logic handled by ActivePieces | ActivePieces Triggers |

## 📂 Migration Checklist
1.  **Move** `CredentialManager`, `DynamicFormBuilder` to `src/components/core`.
2.  **Refactor** `AgentCreationWizard` to use `DynamicFormBuilder` for the "Configuration" step.
3.  **Build** `FlowiseService` to act as the adapter for `ExecutionStatusPanel`.
