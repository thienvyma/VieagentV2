# Architecture V2: Hybrid Engine & Credential Injection

## 1. High-Level Concept
VieAgent V2 operates as a **Master Orchestrator** and **UI Layer** that sits on top of specialized Open Source Engines.

```mermaid
graph TD
    User[User / Customer] -->|1. Configures Agent (Easy Mode)| UI[VieAgent UI]
    User -->|2. Stores Keys| Vault[Credential Vault]
    
    UI -->|3. Trigger Execution| API[VieAgent Backend API]
    
    subgraph "VieAgent Infrastructure"
        API -->|4. Inject Keys & Input| Flowise[Flowise Engine (AI Nodes)]
        API -->|4. Inject Keys & Input| ActivePieces[ActivePieces Engine (Automation)]
        
        Vault -.->|Secure Key Retrieval| API
    end
    
    Flowise -->|5. External API Calls (Using User Keys)| External[OpenAI / Google / Pinecone]
    ActivePieces -->|5. External API Calls| External
    
    Flowise -->|6. Result| API
    ActivePieces -->|6. Result| API
    
    API -->|7. Stream Response / Logs| UI
```

## 2. Core Components

### A. VieAgent UI ("The Face")
-   **Role**: Marketplace display, User config forms, Billing, logs dashboard.
-   **Tech**: Next.js 14, Shadcn/UI.
-   **Key Feature**: "Easy Mode" Forms. Instead of showing a graph, we map `Template Variables` to `Form Inputs`.
    -   *Example*: Flowise has a variable `{{URL}}`. UI shows an input field "Website URL" and passes it to `{{URL}}`.

### B. Credential Vault ("The Wallet")
-   **Role**: Securely store User's API Keys (OpenAI, Anthropic, Google Sheets, etc.).
-   **Security**: Keys are encrypted at rest in Supabase.
-   **Injection**: Keys are decrypted ONLY at runtime by the VieAgent Backend and sent directly to the Engine via `overrideConfig` (Flowise) or `Connections` (ActivePieces).
-   **Benefits**:
    -   VieAgent doesn't pay for usage -> **Zero Marginal Cost**.
    -   Users control their own limits and quotas.

### C. Execution Engines ("The Brains")
1.  **Flowise (AI Focused)**
    -   **Use Cases**: Chatbots, RAG (Chat with PDF/Website), Autonomous Agents.
    -   **Integration**: Via Flowise API (`POST /prediction/{id}`).
    -   **Mapping**: VieAgent stores `FlowId` for each Agent Product.
2.  **ActivePieces (Automation Focused)**
    -   **Use Cases**: Excel processing, Email automation, Social Media posting.
    -   **Integration**: Via ActivePieces Webhook or API.

## 3. Data Flow Example: "Summarize News Agent"

1.  **Setup**:
    -   Admin imports "News Summarizer" template from Flowise into VieAgent.
    -   VieAgent detects required inputs: `News_URL` and `OpenAI_Key`.
2.  **User Action**:
    -   User buys "News Summarizer".
    -   User enters their OpenAI Key into **Credential Vault**.
    -   User pastes a URL into the Agent's form.
3.  **Execution**:
    -   VieAgent Backend calls Flowise: `POST /prediction/agent-id`
    -   Payload:
        ```json
        {
            "question": "Summarize this",
            "overrideConfig": {
                "openAIApiKey": "sk-user-key-decrypted...",
                "News_URL": "https://cnn.com/..."
            }
        }
        ```
4.  **Result**:
    -   Flowise runs, scrapes URL, calls OpenAI.
    -   Returns summary text to VieAgent.
    -   VieAgent saves to `Execution_Logs` and displays to User.

## 4. Development Strategy
-   **Phase 1**: Setup Flowise & ActivePieces instances (Docker/Local).
-   **Phase 2**: Build **Credential Vault** Schema & UI.
-   **Phase 3**: Implement **Template Importer** (Script to fetch JSON -> VieAgent DB).
-   **Phase 4**: Build **Execution Proxy API** (The bridge between UI and Engines).
