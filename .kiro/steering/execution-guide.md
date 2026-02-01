---
inclusion: always
---

# 🚀 Execution Guide - Flowise Integration

## 🔌 Flowise API Basics

### Execute Workflow
```typescript
POST /api/v1/prediction/{chatflowId}

Body: {
  "question": "User input",
  "overrideConfig": {
    "openAIApiKey": "decrypted-key",
    "customVar": "value"
  }
}
```

## 🔐 Credential Injection (CRITICAL)

### Server-Side Only Pattern
```typescript
// ✅ CORRECT: Decrypt on server
const decrypted = await decrypt(cred.encrypted_value, cred.iv);
await flowiseClient.execute({
  credentials: { openai: decrypted }
});

// ❌ WRONG: Never send to client
return { decrypted_key: decrypted }; // NEVER DO THIS!
```

## 🛡️ Security Rules

1. **Decrypt credentials ONLY on server**
2. **Never log decrypted keys**
3. **Validate user owns agent**
4. **Use HTTPS for Flowise**
5. **Implement rate limiting**

## 📊 Execution Flow

```
1. User submits form
2. Backend validates auth
3. Fetch agent config
4. Decrypt credentials
5. Call Flowise with overrideConfig
6. Save execution log
7. Return result (NO credentials)
```

## 🔄 Status Polling

```typescript
// Frontend polls every 2 seconds
const interval = setInterval(async () => {
  const status = await fetch(`/api/execute/status/${id}`);
  if (status === 'completed') clearInterval(interval);
}, 2000);
```

## ⚠️ Error Handling

- **Connection Failed**: 503 Service Unavailable
- **Invalid Key**: 400 Bad Request + "Update credential"
- **Timeout**: 408 Request Timeout
- **Rate Limit**: 429 Too Many Requests

## 📚 Reference

- Flowise Docs: https://docs.flowiseai.com
- Encryption: `lib/encryption.ts`
- Database: `docs_v2/DATABASE.md`
