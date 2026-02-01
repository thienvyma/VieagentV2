---
inclusion: always
---

# 📝 Quick Coding Reference - VieAgent.vn v2

## 🏗️ Component Template (Shadcn + V2)

```typescript
'use client';

import { useState } from 'react';
// NOTE: V2 Component Path
import { Button } from '@/components/core/ui/button'; 
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button disabled={loading}>
      Click Me
    </Button>
  );
}
```

## 🌐 API Route Template (Supabase Async)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // V2 path

export async function GET(request: NextRequest) {
    const supabase = await createClient(); // MUST await
    const { data: { user } } = await supabase.auth.getUser();
    
    // ... logic
}
```

## 📦 Directory Map

- **UI Components**: `@/components/core/ui/`
- **Business Logic**: `@/components/business/`
- **Engines**: `@/lib/engines/`
- **Vault**: `@/components/business/vault/`

## ✅ Do's & Don'ts

### ✅ DO
- Use `components/core/ui` for Shadcn.
- Await `createClient()` in Server Components.
- Use `zod` for all form validation.

### ❌ DON'T
- Import from `components/ui` (Legacy path).
- Hardcode API keys (Use Vault).
- Create "Workflow Builders" (Use Flowise).
