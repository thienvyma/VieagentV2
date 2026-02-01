# 🎯 Priority Implementation Guide - VieAgent V2

**Mục đích**: Hướng dẫn chi tiết thứ tự làm và vị trí file cho các điểm cần cải thiện

---

## 📊 Thứ Tự Ưu Tiên

### 🔴 PRIORITY 1: CRITICAL (Làm Trước - Tuần 1-3)

#### 1.1 Execution Engine (CRITICAL - Không có thì app không chạy được)

**Vị trí file cần tạo**:
```
vieagent-app/
├── lib/
│   └── engines/
│       └── flowise.ts                    ⭐ TẠO MỚI - Tuần 1
│
├── app/
│   └── api/
│       └── execute/
│           ├── [agentId]/
│           │   └── route.ts              ⭐ TẠO MỚI - Tuần 1
│           └── status/
│               └── [executionId]/
│                   └── route.ts          ⭐ TẠO MỚI - Tuần 1
```

**Chi tiết implementation**:

##### File 1: `vieagent-app/lib/engines/flowise.ts`
```typescript
// ⭐ TẠO MỚI - Ngày 1-2
// Mục đích: Client để gọi Flowise API

export class FlowiseClient {
  private apiUrl: string;
  private apiKey?: string;

  constructor(config?: { apiUrl?: string; apiKey?: string }) {
    this.apiUrl = config?.apiUrl || process.env.FLOWISE_API_URL || 'http://localhost:3000';
    this.apiKey = config?.apiKey || process.env.FLOWISE_API_KEY;
  }

  async executeWorkflow(params: {
    flowId: string;
    inputs: Record<string, any>;
    credentials: Record<string, string>;
  }): Promise<{ text: string; chatId: string }> {
    // Implementation here
    // See: vieagent-app/.agent/rules/execution-guide.md
  }

  async getExecutionStatus(executionId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: any;
  }> {
    // Implementation here
  }
}
```

##### File 2: `vieagent-app/app/api/execute/[agentId]/route.ts`
```typescript
// ⭐ TẠO MỚI - Ngày 3-4
// Mục đích: API endpoint để execute agent

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { FlowiseClient } from '@/lib/engines/flowise';
import { decrypt } from '@/lib/encryption';

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  // 1. Validate auth
  // 2. Fetch agent config
  // 3. Decrypt credentials
  // 4. Call Flowise
  // 5. Save execution log
  // 6. Return result
  
  // See: vieagent-app/.agent/rules/execution-guide.md
}
```

##### File 3: `vieagent-app/app/api/execute/status/[executionId]/route.ts`
```typescript
// ⭐ TẠO MỚI - Ngày 5
// Mục đích: API để poll execution status

export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  // Query execution_logs table
  // Return status + output
}
```

**Tài liệu tham khảo**:
- `PHASE_7_DETAILED_PLAN.md` - Section 7.1
- `vieagent-app/.agent/rules/execution-guide.md`
- `docs_v2/ARCHITECTURE_V2.md`

---

#### 1.2 Credential Injection Logic (CRITICAL - Bảo mật)

**Vị trí file cần sửa**:
```
vieagent-app/
├── lib/
│   └── encryption.ts                     ✏️ KIỂM TRA/BỔ SUNG - Tuần 1
│
└── app/
    └── api/
        └── credentials/
            └── test/
                └── route.ts              ⭐ TẠO MỚI - Tuần 2
```

**Chi tiết implementation**:

##### File 1: `vieagent-app/lib/encryption.ts`
```typescript
// ✏️ KIỂM TRA - Đảm bảo có đủ functions
// Nếu chưa có thì TẠO MỚI

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export async function encrypt(text: string): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export async function decrypt(
  encrypted: string,
  iv: string,
  authTag: string
): Promise<string> {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

##### File 2: `vieagent-app/app/api/credentials/test/route.ts`
```typescript
// ⭐ TẠO MỚI - Tuần 2
// Mục đích: Test credential validity

export async function POST(req: NextRequest) {
  const { provider, api_key } = await req.json();
  
  // Test based on provider
  switch (provider) {
    case 'openai':
      // Call OpenAI API to validate
      break;
    case 'gemini':
      // Call Gemini API to validate
      break;
    // ... other providers
  }
  
  return NextResponse.json({ valid: true });
}
```

**Tài liệu tham khảo**:
- `vieagent-app/.agent/rules/execution-guide.md` - Section "Credential Injection"
- `docs_v2/DATABASE.md` - credentials table

---

### 🟡 PRIORITY 2: HIGH (Làm Sau - Tuần 4-5)

#### 2.1 Agent Detail Page

**Vị trí file cần tạo**:
```
vieagent-app/
└── app/
    └── [locale]/
        └── agent/
            └── [id]/
                └── page.tsx              ⭐ TẠO MỚI - Tuần 4
```

**Chi tiết implementation**:

##### File: `vieagent-app/app/[locale]/agent/[id]/page.tsx`
```typescript
// ⭐ TẠO MỚI - Tuần 4
// Mục đích: Trang chi tiết agent

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function AgentDetailPage({
  params
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!agent) notFound();
  
  return (
    <div className="container py-10">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground">{agent.description}</p>
      </div>
      
      {/* Features */}
      {/* Requirements */}
      {/* Pricing */}
      {/* Reviews */}
      {/* Similar Agents */}
    </div>
  );
}
```

**Tài liệu tham khảo**:
- `UX_UI_IMPROVEMENT_PLAN.md` - Section "Agent Detail Page"
- `reference-components/EnhancedAgentMarketplace.tsx` - Để tham khảo UI

---

#### 2.2 Marketplace Enhancements

**Vị trí file cần sửa/tạo**:
```
vieagent-app/
├── app/
│   └── [locale]/
│       └── marketplace/
│           └── page.tsx                  ✏️ SỬA - Tuần 4
│
└── components/
    └── business/
        └── marketplace/
            ├── agent-filters.tsx         ⭐ TẠO MỚI - Tuần 4
            ├── agent-search.tsx          ⭐ TẠO MỚI - Tuần 4
            └── agent-grid.tsx            ✏️ SỬA - Tuần 4
```

**Chi tiết implementation**:

##### File 1: `vieagent-app/components/business/marketplace/agent-filters.tsx`
```typescript
// ⭐ TẠO MỚI - Tuần 4
// Mục đích: Filters cho marketplace

'use client';

import { useState } from 'react';
import { Label } from '@/components/core/ui/label';
import { Slider } from '@/components/core/ui/slider';

export function AgentFilters({
  onFilterChange
}: {
  onFilterChange: (filters: any) => void;
}) {
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <Label>Price Range</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={100}
          step={1}
        />
      </div>
      
      {/* Categories */}
      {/* Rating */}
      {/* Complexity */}
    </div>
  );
}
```

##### File 2: `vieagent-app/components/business/marketplace/agent-search.tsx`
```typescript
// ⭐ TẠO MỚI - Tuần 4
// Mục đích: Search bar cho marketplace

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/core/ui/input';

export function AgentSearch({
  onSearch
}: {
  onSearch: (query: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search agents..."
        className="pl-10"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
```

**Tài liệu tham khảo**:
- `UX_UI_IMPROVEMENT_PLAN.md` - Section "Marketplace Experience"
- `reference-components/EnhancedAgentMarketplace.tsx`

---

#### 2.3 Billing Page

**Vị trí file cần sửa**:
```
vieagent-app/
└── app/
    └── [locale]/
        └── dashboard/
            └── billing/
                └── page.tsx              ✏️ SỬA HOÀN TOÀN - Tuần 5
```

**Chi tiết implementation**:

##### File: `vieagent-app/app/[locale]/dashboard/billing/page.tsx`
```typescript
// ✏️ SỬA HOÀN TOÀN - Tuần 5
// Hiện tại: Placeholder
// Cần: Full billing UI với Stripe

import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/core/ui/card';
import { Button } from '@/components/core/ui/button';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user's subscription
  // Fetch usage stats
  // Fetch invoices
  
  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Free Plan</p>
          <Button>Upgrade to Pro</Button>
        </CardContent>
      </Card>
      
      {/* Usage */}
      {/* Invoices */}
      {/* Payment Methods */}
    </div>
  );
}
```

**Tài liệu tham khảo**:
- `UX_UI_IMPROVEMENT_PLAN.md` - Section "Billing Page"
- `reference-components/AdvancedBillingSystem.tsx`

---

### 🟢 PRIORITY 3: MEDIUM (Làm Cuối - Tuần 6+)

#### 3.1 Admin Tools

**Vị trí file cần sửa/tạo**:
```
vieagent-app/
└── app/
    └── [locale]/
        └── dashboard/
            └── admin/
                ├── agents/
                │   └── new/
                │       └── page.tsx      ✏️ SỬA - Tuần 6
                └── users/
                    └── page.tsx          ✏️ SỬA - Tuần 6
```

**Chi tiết implementation**:

##### File 1: `vieagent-app/app/[locale]/dashboard/admin/agents/new/page.tsx`
```typescript
// ✏️ SỬA - Tuần 6
// Hiện tại: Basic form
// Cần: Step-by-step wizard

import { AgentCreationWizard } from '@/components/business/admin/agent-creation-wizard';

export default function NewAgentPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Agent</h1>
      <AgentCreationWizard />
    </div>
  );
}
```

##### File 2: `vieagent-app/components/business/admin/agent-creation-wizard.tsx`
```typescript
// ⭐ TẠO MỚI - Tuần 6
// Mục đích: Wizard để tạo agent

'use client';

import { useState } from 'react';
import { Button } from '@/components/core/ui/button';

export function AgentCreationWizard() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex justify-between">
        <div className={step >= 1 ? 'text-primary' : 'text-muted'}>1. Basic Info</div>
        <div className={step >= 2 ? 'text-primary' : 'text-muted'}>2. Flowise Config</div>
        <div className={step >= 3 ? 'text-primary' : 'text-muted'}>3. Pricing</div>
        <div className={step >= 4 ? 'text-primary' : 'text-muted'}>4. Review</div>
      </div>
      
      {/* Step Content */}
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <FlowiseConfigStep />}
      {step === 3 && <PricingStep />}
      {step === 4 && <ReviewStep />}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={() => setStep(step - 1)} disabled={step === 1}>
          Previous
        </Button>
        <Button onClick={() => setStep(step + 1)} disabled={step === 4}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

**Tài liệu tham khảo**:
- `UX_UI_IMPROVEMENT_PLAN.md` - Section "Admin Portal"
- `reference-components/AgentCreationWizard.tsx`

---

## 📋 Checklist Tổng Hợp

### Tuần 1-3: Phase 7 - Execution Engine (CRITICAL)
- [ ] Tạo `lib/engines/flowise.ts`
- [ ] Tạo `app/api/execute/[agentId]/route.ts`
- [ ] Tạo `app/api/execute/status/[executionId]/route.ts`
- [ ] Kiểm tra `lib/encryption.ts`
- [ ] Tạo `app/api/credentials/test/route.ts`
- [ ] Test end-to-end execution flow
- [ ] Security audit

### Tuần 4-5: UX Improvements (HIGH)
- [ ] Tạo `app/[locale]/agent/[id]/page.tsx`
- [ ] Tạo `components/business/marketplace/agent-filters.tsx`
- [ ] Tạo `components/business/marketplace/agent-search.tsx`
- [ ] Sửa `app/[locale]/marketplace/page.tsx`
- [ ] Sửa `app/[locale]/dashboard/billing/page.tsx`
- [ ] Integrate Stripe

### Tuần 6+: Admin Tools (MEDIUM)
- [ ] Tạo `components/business/admin/agent-creation-wizard.tsx`
- [ ] Sửa `app/[locale]/dashboard/admin/agents/new/page.tsx`
- [ ] Sửa `app/[locale]/dashboard/admin/users/page.tsx`
- [ ] Add user management features

---

## 🎯 Quick Reference

### Khi bắt đầu mỗi task:
1. Đọc tài liệu tham khảo liên quan
2. Xem reference component (nếu có)
3. Tạo/sửa file theo đúng vị trí
4. Test locally
5. Commit với message rõ ràng

### Tài liệu chính:
- **Phase 7**: `PHASE_7_DETAILED_PLAN.md`
- **UX/UI**: `UX_UI_IMPROVEMENT_PLAN.md`
- **Testing**: `vieagent-app/.agent/rules/testing-guide.md`
- **Execution**: `vieagent-app/.agent/rules/execution-guide.md`

### Khi gặp vấn đề:
1. Check steering files trong `.kiro/steering/`
2. Check common mistakes trong `common-mistakes.md`
3. Review architecture trong `architecture.md`

---

## 🚀 Bắt Đầu Ngay

**Hôm nay**: Tạo `lib/engines/flowise.ts`
**Ngày mai**: Tạo execution API routes
**Tuần sau**: Test và polish

Let's build! 🎉
