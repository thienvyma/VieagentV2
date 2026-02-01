# Gap Analysis & Integration Strategy

## Legacy Context
Originally, we planned to build a custom Workflow Builder using **React Flow** to compete with n8n.
**Problem**: Building a feature-rich engine takes years. React Flow is just a UI library.
**Solution**: Pivot to **Hybrid Architecture**.

## Strategy Shift: Build vs. Buy (Open Source)

| Feature | Custom React Flow Engine | Hybrid (Flowise + ActivePieces) | Decision |
| :--- | :--- | :--- | :--- |
| **Dev Time** | Months/Years | Immediate (Ready to use) | **Hybrid** |
| **Maintenance** | High (We maintain all nodes) | Low (Community maintains) | **Hybrid** |
| **Integrations** | We build 1-by-1 | Thousands available | **Hybrid** |
| **User Exp** | Complex Graph Editor | Simple Forms ("Easy Mode") | **Hybrid** |
| **AI Capable** | We code from scratch | Native (LangChain/LlamaIndex) | **Hybrid** |

## Integration Gaps & Solutions

### 1. No Graph UI for Users
-   **Gap**: Users cannot "drag and drop" nodes like in n8n.
-   **Solution**: We don't want them to! We offer **"Easy Mode" Forms**.
-   **Implementation**: Map Flowise `Variables` to `CreateAgentForm`.

### 2. Credential Management
-   **Gap**: Flowise stores credentials internally. We want "BYOK" (User's Keys).
-   **Solution**: **Credential Injection**.
-   **Implementation**: Store keys in VieAgent (Encrypted). Inject into Flowise API calls via `overrideConfig`.

### 3. Marketplace Content
-   **Gap**: Empty marketplace.
-   **Solution**: **Template Import Script**.
-   **Implementation**: Scrape/Export JSONs from Flowise Marketplace -> Import to VieAgent DB.

## Conclusion
The "Gap" is closed by adopting specialized engines.
-   **Flowise** handles the "Thinking" (AI).
-   **ActivePieces** handles the "Doing" (Automation).
-   **VieAgent** handles the "Experience" (Marketplace, UI, Payment).
