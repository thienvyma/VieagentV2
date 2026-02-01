# Workflow Builder: "Easy Mode" UI Strategy

## 1. Philosophy Shift
Old Strategy: "User drags and drops nodes to build logic." (Hard, requires learning curve).
**New Strategy**: "User fills a form. Logic happens in the background." (Easy, zero learning curve).

## 2. Core Components

### A. Template Mapping
We map a complicated **Flowise/ActivePieces Flow** to a simple **UI Form Schema**.

**Example: News Summarizer Flow**
-   **Flowise Variables**: `{{URL}}`, `{{Tone}}`, `{{Language}}`.
-   **VieAgent UI Schema**:
    ```json
    {
      "inputs": [
        { "name": "URL", "type": "text", "label": "Paste Article Link", "required": true },
        { "name": "Tone", "type": "select", "options": ["Professional", "Witty"], "default": "Professional" },
        { "name": "Language", "type": "text", "default": "Vietnamese", "hidden": true }
      ]
    }
    ```

### B. Dynamic Form Builder (`components/builder/DynamicForm.tsx`)
This component renders the UI based on the Schema.
-   If `type` is `file` -> Render File Upload (upload to Supabase Storage, pass URL to Flowise).
-   If `type` is `credential` -> Render Credential Selector (from Vault).

## 3. Implementation Steps

### Step 1: Template Ingestion
Create a script to parse Flowise JSON files and generate the `UI Schema`.
-   Flowise JSON has `node.data.inputs`.
-   We scan these inputs:
    -   If `type` is "string" -> UI Text Input.
    -   If `label` contains "Key" -> UI Credential Selector.

### Step 2: Runtime Execution
When User submits the Form:
1.  **Frontend**: Collects data -> `POST /api/execute/agent/{id}`.
2.  **Backend**:
    -   Validates Inputs.
    -   Fetches `FlowId` from DB.
    -   Fetches Decrypted Credential from Vault.
    -   Merges Inputs + Credentials.
    -   Calls Flowise API.

## 4. "Advanced Mode" (Optional Future)
If a Developer wants to modify the Flow logic itself:
-   We can embed the **Flowise Canvas** via Iframe or React Component (if they release an npm package).
-   OR allow them to "Eject" the template, export JSON, edit in their local Flowise, and re-import.

## 5. Checklist
- [ ] Implement `DynamicForm` component.
- [ ] Design `CredentialSelector` component.
- [ ] Build Backend API for Flowise proxy.
