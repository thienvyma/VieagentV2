# Webhook Integration - VieAgent.vn

## 🎯 Tổng quan

Dự án này là **marketplace** cho AI agents được tạo bằng các nền tảng workflow như:
- **n8n** (Self-hosted)
- **Zapier**
- **Make.com (Integromat)**

Agents KHÔNG phải code chạy trong platform mà là **webhook endpoints**.

---

## 🔌 FLOW HOẠT ĐỘNG

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Customer   │─────▶│  VieAgent   │─────▶│  n8n/Zapier  │
│   Browser    │      │   Platform   │      │   Webhook    │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │  1. Fill form       │  2. POST request    │
       │  (Nhập input)       │  (Send payload)     │
       │                     │                     │
       │                     │  3. Process         │
       │                     │  (Xử lý workflow)   │
       │                     │                     │
       │  5. Show result     │  4. JSON response   │
       │  (Hiển thị KQ)      │  (Trả kết quả)      │
       │◀────────────────────│◀────────────────────│
```

---

## 📤 WEBHOOK REQUEST FORMAT

```json
{
  "execution_id": "exec-uuid-here",
  "agent_id": "agent-uuid-here",
  "user_id": "user-uuid-here",
  "timestamp": "2026-01-31T12:00:00Z",
  
  "credentials": {
    "gmail_access_token": "ya29.xxx...",
    "slack_bot_token": "xoxb-xxx...",
    "openai_api_key": "sk-xxx..."
  },
  
  "input": {
    "recipient_email": "customer@example.com",
    "subject": "Hello from VieAgent",
    "body": "This is an automated email..."
  }
}
```

### Headers
```http
POST /webhook/agent-123 HTTP/1.1
Host: your-n8n.com
Content-Type: application/json
X-VieAgent-Signature: sha256=abc123...
X-VieAgent-Execution-Id: exec-uuid
```

---

## 📥 WEBHOOK RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "data": {
    "email_sent": true,
    "message_id": "msg-12345",
    "recipients": ["customer@example.com"]
  },
  "message": "Email sent successfully",
  "execution_time_ms": 1234
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "GMAIL_AUTH_FAILED",
    "message": "Gmail access token expired"
  }
}
```

---

## 🔧 n8n SETUP GUIDE

### Bước 1: Tạo Webhook Trigger
```
1. Add new node → Trigger → Webhook
2. HTTP Method: POST
3. Path: /agent/{your-agent-id}
4. Response Mode: Last Node
```

### Bước 2: Parse Input
```javascript
// Code node để parse input
const execution = $input.first().json;

return {
  executionId: execution.execution_id,
  userInput: execution.input,
  credentials: execution.credentials
};
```

### Bước 3: Xử lý Logic
```
Add nodes for your workflow:
- Gmail node (send email)
- HTTP Request node (API calls)
- Set node (transform data)
```

### Bước 4: Return Response
```javascript
// Respond to Webhook node
return {
  success: true,
  data: {
    result: "Your output here"
  },
  execution_time_ms: Date.now() - $execution.startedAt
};
```

---

## ⚡ Zapier SETUP GUIDE

### Bước 1: Create Zap
```
1. Trigger: Webhooks by Zapier → Catch Hook
2. Copy generated webhook URL
```

### Bước 2: Parse Data
```
Add Formatter action to parse JSON:
- Transform → Text → From JSON
```

### Bước 3: Add Actions
```
Add your desired actions:
- Gmail: Send Email
- Slack: Send Channel Message
- etc.
```

### Bước 4: Return Data
```
Last step: Webhooks by Zapier → Return Data
Return JSON with success/data
```

---

## 🎨 Make.com SETUP GUIDE

### Bước 1: Custom Webhook
```
1. Create new Scenario
2. Add Webhooks → Custom webhook
3. Copy webhook URL
```

### Bước 2: Define Data Structure
```
Use "Edit data structure" to match:
- execution_id: Text
- user_id: Text
- credentials: Collection
- input: Collection
```

### Bước 3: Add Modules
```
Add modules for your workflow:
- Email, Google Sheets, HTTP, etc.
```

### Bước 4: Webhook Response
```
Add "Webhook response" module at end
Return JSON body with results
```

---

## 🛡️ SECURITY

### Webhook Signature Verification

```typescript
// Verify webhook signature
import crypto from 'crypto';

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expected}` === signature;
}
```

### Agent Secret
```
Mỗi agent có secret key riêng:
- Lưu trong database (encrypted)
- Gửi trong header: X-VieAgent-Signature
- Webhook phải verify trước khi xử lý
```

---

## ⚡ RETRY LOGIC

```typescript
// Retry config
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2,
  maxDelay: 10000, // 10 seconds
  timeoutMs: 30000, // 30 second timeout
};

// Retry flow
// Attempt 1: immediate
// Attempt 2: after 1s
// Attempt 3: after 2s (exponential)
// Attempt 4: after 4s (if configured)
```

---

## 📊 EXECUTION LOGGING

```sql
-- Lưu log mỗi lần call webhook
INSERT INTO execution_logs (
  execution_id,
  request_url,
  request_body,
  response_status,
  response_body,
  duration_ms,
  attempt_number
) VALUES (...);
```

### Log Columns:
| Column | Type | Description |
|--------|------|-------------|
| execution_id | UUID | Link to executions table |
| request_url | TEXT | Webhook URL |
| request_body | JSONB | Full request payload |
| response_status | INT | HTTP status (200, 500, etc.) |
| response_body | JSONB | Response from webhook |
| duration_ms | INT | Request duration |
| attempt_number | INT | Retry attempt (1, 2, 3) |

---

## ✅ CHECKLIST IMPLEMENTATION

### Core Requirements
- [ ] Webhook URL validator
- [ ] Payload builder với credentials
- [ ] HTTP client với timeout
- [ ] Response parser
- [ ] Error mapping

### Advanced Features
- [ ] Retry với exponential backoff
- [ ] Signature generation/verification
- [ ] Request/response logging
- [ ] Rate limiting per agent
- [ ] Timeout configuration
- [ ] Async execution cho long-running

### Developer Tools
- [ ] Webhook tester UI
- [ ] n8n template generator
- [ ] Zapier setup guide
- [ ] Make.com setup guide
- [ ] Execution logs viewer
