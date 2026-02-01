---
inclusion: always
---

# ⚠️ Common Mistakes & How to Avoid - VieAgent.vn v2

## 🔴 CRITICAL MISTAKES

### 1. Wrong Component Path ❌
```typescript
// ❌ WRONG
import { Button } from '@/components/ui/button';

// ✅ CORRECT
import { Button } from '@/components/core/ui/button';
```

### 2. Sync Supabase Client in Server ❌
```typescript
// ❌ WRONG
const supabase = createClient();
const { data } = await supabase...

// ✅ CORRECT
const supabase = await createClient(); // Await is mandatory in Next.js 15+
const { data } = await supabase...
```

### 3. Building Internal Engines ❌
- **Mistake**: "I'm creating a `ReactFlow` editor for the user."
- **Correction**: Stop. Use `Flowise` or `ActivePieces`. We only build **Forms**.

### 4. Hardcoding Credentials ❌
- **Mistake**: `const OPENAI_KEY = "sk-..."`
- **Correction**: Use the **Vault**.
```typescript
// Frontend
<CredentialSelect provider="openai" />
// Backend
const key = await decrypt(credential.encrypted_value);
```

## 🟡 General Hygiene

### 5. File Structure
- `app/` -> Routes
- `components/core/ui` -> Shadcn
- `components/business` -> Feature specific
- `lib/engines` -> Flowise/AP drivers

### 6. Strict Types
- No `any`. Define `interface AgentInput { ... }`.
