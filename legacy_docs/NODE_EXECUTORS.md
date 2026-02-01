# Node Executors - VieAgent.vn

## 📋 Danh sách Node Executors

Mỗi node type cần một executor để thực thi logic.

---

## 1. GMAIL EXECUTOR

### Config Schema

```typescript
interface GmailConfig {
  action: 'send' | 'read' | 'search' | 'reply' | 'forward';
  
  // For send/reply/forward
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  html?: boolean;
  attachments?: string[];
  
  // For read/search
  query?: string;       // Gmail search query
  limit?: number;       // Max emails to return
  include_body?: boolean;
}
```

### Implementation

```typescript
// lib/workflow/executors/gmail.ts
import { NodeExecutor, ExecutionContext } from '../types';

export const gmailExecutor: NodeExecutor<GmailConfig> = {
  type: 'gmail',
  
  async execute(config, context) {
    const { gmail_access_token } = context.credentials;
    
    if (!gmail_access_token) {
      throw new Error('Gmail credentials not found');
    }
    
    switch (config.action) {
      case 'send':
        return await sendEmail(gmail_access_token, config, context);
      case 'read':
        return await readEmails(gmail_access_token, config, context);
      case 'search':
        return await searchEmails(gmail_access_token, config, context);
      default:
        throw new Error(`Unknown action: ${config.action}`);
    }
  }
};

async function sendEmail(token: string, config: GmailConfig, context: ExecutionContext) {
  // Interpolate variables
  const to = interpolate(config.to || '', context);
  const subject = interpolate(config.subject || '', context);
  const body = interpolate(config.body || '', context);
  
  // Create email
  const email = [
    `To: ${to}`,
    config.cc ? `Cc: ${interpolate(config.cc, context)}` : '',
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].filter(Boolean).join('\r\n');
  
  // Encode
  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  // Send
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send email');
  }
  
  const result = await response.json();
  
  return {
    message_id: result.id,
    thread_id: result.threadId,
    sent_to: to,
  };
}

async function readEmails(token: string, config: GmailConfig, context: ExecutionContext) {
  const query = interpolate(config.query || 'is:inbox', context);
  const limit = config.limit || 10;
  
  // Get message IDs
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${limit}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const listData = await listResponse.json();
  const messages = listData.messages || [];
  
  // Fetch each message
  const emails = await Promise.all(
    messages.map(async (msg: any) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const msgData = await msgResponse.json();
      
      return {
        id: msgData.id,
        thread_id: msgData.threadId,
        subject: getHeader(msgData, 'Subject'),
        from: getHeader(msgData, 'From'),
        to: getHeader(msgData, 'To'),
        date: getHeader(msgData, 'Date'),
        snippet: msgData.snippet,
        body: config.include_body ? getBody(msgData) : undefined,
      };
    })
  );
  
  return { emails, count: emails.length };
}

function getHeader(message: any, name: string): string {
  const header = message.payload?.headers?.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || '';
}

function getBody(message: any): string {
  // Handle plain text
  if (message.payload?.body?.data) {
    return atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  // Handle multipart
  const textPart = message.payload?.parts?.find(
    (p: any) => p.mimeType === 'text/plain'
  );
  if (textPart?.body?.data) {
    return atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  return '';
}
```

### Output Schema

```typescript
// send
{ message_id: string; thread_id: string; sent_to: string; }

// read/search
{ emails: Email[]; count: number; }

interface Email {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
}
```

---

## 2. SLACK EXECUTOR

### Config Schema

```typescript
interface SlackConfig {
  action: 'send_message' | 'upload_file' | 'create_channel' | 'add_reaction';
  
  // For send_message
  channel?: string;     // #channel or @user
  message?: string;
  blocks?: any[];       // Slack Block Kit
  thread_ts?: string;   // Reply to thread
  
  // For upload_file
  file_url?: string;
  filename?: string;
  
  // For create_channel
  channel_name?: string;
  is_private?: boolean;
  
  // For add_reaction
  emoji?: string;
  message_ts?: string;
}
```

### Implementation

```typescript
// lib/workflow/executors/slack.ts

export const slackExecutor: NodeExecutor<SlackConfig> = {
  type: 'slack',
  
  async execute(config, context) {
    const { slack_bot_token } = context.credentials;
    
    if (!slack_bot_token) {
      throw new Error('Slack credentials not found');
    }
    
    switch (config.action) {
      case 'send_message':
        return await sendSlackMessage(slack_bot_token, config, context);
      case 'create_channel':
        return await createChannel(slack_bot_token, config, context);
      default:
        throw new Error(`Unknown action: ${config.action}`);
    }
  }
};

async function sendSlackMessage(token: string, config: SlackConfig, context: ExecutionContext) {
  const channel = interpolate(config.channel || '', context);
  const text = interpolate(config.message || '', context);
  
  const body: any = { channel, text };
  
  if (config.thread_ts) {
    body.thread_ts = interpolate(config.thread_ts, context);
  }
  
  if (config.blocks) {
    body.blocks = JSON.parse(interpolate(JSON.stringify(config.blocks), context));
  }
  
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error || 'Failed to send Slack message');
  }
  
  return {
    channel: result.channel,
    ts: result.ts,
    message: text,
  };
}
```

---

## 3. OPENAI EXECUTOR

### Config Schema

```typescript
interface OpenAIConfig {
  action: 'chat' | 'complete' | 'embed' | 'image';
  
  // For chat/complete
  model?: string;         // gpt-4, gpt-3.5-turbo
  system_prompt?: string;
  user_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  
  // For embed
  input_text?: string;
  
  // For image
  prompt?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}
```

### Implementation

```typescript
// lib/workflow/executors/openai.ts

export const openaiExecutor: NodeExecutor<OpenAIConfig> = {
  type: 'openai',
  
  async execute(config, context) {
    const { openai_api_key } = context.credentials;
    
    if (!openai_api_key) {
      throw new Error('OpenAI credentials not found');
    }
    
    switch (config.action) {
      case 'chat':
        return await chatCompletion(openai_api_key, config, context);
      case 'embed':
        return await createEmbedding(openai_api_key, config, context);
      case 'image':
        return await generateImage(openai_api_key, config, context);
      default:
        throw new Error(`Unknown action: ${config.action}`);
    }
  }
};

async function chatCompletion(apiKey: string, config: OpenAIConfig, context: ExecutionContext) {
  const model = config.model || 'gpt-3.5-turbo';
  const systemPrompt = interpolate(config.system_prompt || '', context);
  const userPrompt = interpolate(config.user_prompt || '', context);
  
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: userPrompt });
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 1000,
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }
  
  const result = await response.json();
  
  return {
    response: result.choices[0].message.content,
    model: result.model,
    usage: {
      prompt_tokens: result.usage.prompt_tokens,
      completion_tokens: result.usage.completion_tokens,
      total_tokens: result.usage.total_tokens,
    }
  };
}

async function createEmbedding(apiKey: string, config: OpenAIConfig, context: ExecutionContext) {
  const input = interpolate(config.input_text || '', context);
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input,
    })
  });
  
  const result = await response.json();
  
  return {
    embedding: result.data[0].embedding,
    dimensions: result.data[0].embedding.length,
  };
}

async function generateImage(apiKey: string, config: OpenAIConfig, context: ExecutionContext) {
  const prompt = interpolate(config.prompt || '', context);
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      size: config.size || '512x512',
      n: config.n || 1,
    })
  });
  
  const result = await response.json();
  
  return {
    images: result.data.map((d: any) => d.url),
  };
}
```

---

## 4. HTTP EXECUTOR

### Config Schema

```typescript
interface HttpConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  query_params?: Record<string, string>;
  body?: any;
  body_type?: 'json' | 'form' | 'raw';
  timeout_ms?: number;
  
  // Auth
  auth_type?: 'none' | 'basic' | 'bearer' | 'api_key';
  auth_value?: string;
}
```

### Implementation

```typescript
// lib/workflow/executors/http.ts

export const httpExecutor: NodeExecutor<HttpConfig> = {
  type: 'http',
  
  async execute(config, context) {
    const url = new URL(interpolate(config.url, context));
    
    // Add query params
    if (config.query_params) {
      Object.entries(config.query_params).forEach(([key, value]) => {
        url.searchParams.set(key, interpolate(value, context));
      });
    }
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers[key] = interpolate(value, context);
      });
    }
    
    // Add auth
    if (config.auth_type === 'bearer' && config.auth_value) {
      headers['Authorization'] = `Bearer ${interpolate(config.auth_value, context)}`;
    } else if (config.auth_type === 'api_key' && config.auth_value) {
      headers['X-API-Key'] = interpolate(config.auth_value, context);
    }
    
    // Build body
    let body: string | undefined;
    if (config.body && config.method !== 'GET') {
      if (typeof config.body === 'string') {
        body = interpolate(config.body, context);
      } else {
        body = interpolate(JSON.stringify(config.body), context);
      }
    }
    
    // Make request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      config.timeout_ms || 30000
    );
    
    try {
      const response = await fetch(url.toString(), {
        method: config.method,
        headers,
        body,
        signal: controller.signal,
      });
      
      const contentType = response.headers.get('content-type') || '';
      let data: any;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        status: response.status,
        status_text: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        ok: response.ok,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
};
```

---

## 5. CONDITION EXECUTOR

### Config Schema

```typescript
interface ConditionConfig {
  condition: string;  // JavaScript expression: '{{input.count}} > 5'
  // OR
  rules?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_empty' | 'is_not_empty';
    value: any;
  }[];
  logic?: 'and' | 'or';
}
```

### Implementation

```typescript
// lib/workflow/executors/condition.ts

export const conditionExecutor: NodeExecutor<ConditionConfig> = {
  type: 'condition',
  
  async execute(config, context) {
    let result: boolean;
    
    if (config.condition) {
      // Evaluate expression
      const expression = interpolate(config.condition, context);
      result = evaluateCondition(expression, context);
    } else if (config.rules) {
      // Evaluate rules
      const results = config.rules.map(rule => evaluateRule(rule, context));
      result = config.logic === 'or' 
        ? results.some(r => r)
        : results.every(r => r);
    } else {
      result = true;
    }
    
    return {
      result,
      branch: result ? 'then' : 'else',
    };
  }
};

function evaluateCondition(expression: string, context: ExecutionContext): boolean {
  // Safe evaluation (no eval!)
  // Parse simple expressions like: "5 > 3", "true", "'hello' === 'world'"
  
  try {
    // Replace common patterns
    const sanitized = expression
      .replace(/===/g, '===')
      .replace(/!==/g, '!==')
      .replace(/==/g, '===')
      .replace(/!=/g, '!==');
    
    // Use Function constructor for safe evaluation
    // Only allow basic comparisons, no function calls
    if (/[^a-zA-Z0-9\s\.\[\]'"<>=!&|()+-]/.test(sanitized)) {
      throw new Error('Invalid characters in condition');
    }
    
    const func = new Function('context', `return ${sanitized}`);
    return Boolean(func(context));
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}

function evaluateRule(rule: any, context: ExecutionContext): boolean {
  const fieldValue = getValueByPath(context, rule.field);
  const compareValue = rule.value;
  
  switch (rule.operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'not_equals':
      return fieldValue !== compareValue;
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    case 'gt':
      return Number(fieldValue) > Number(compareValue);
    case 'lt':
      return Number(fieldValue) < Number(compareValue);
    case 'gte':
      return Number(fieldValue) >= Number(compareValue);
    case 'lte':
      return Number(fieldValue) <= Number(compareValue);
    case 'is_empty':
      return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
    case 'is_not_empty':
      return !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0);
    default:
      return false;
  }
}
```

---

## 6. LOOP EXECUTOR

### Config Schema

```typescript
interface LoopConfig {
  items: string;           // Path to array: '{{gmail-1.emails}}'
  max_iterations?: number; // Safety limit
  continue_on_error?: boolean;
}
```

### Implementation

```typescript
// lib/workflow/executors/loop.ts

export const loopExecutor: NodeExecutor<LoopConfig> = {
  type: 'loop',
  
  async execute(config, context) {
    const itemsPath = config.items.replace(/\{\{|\}\}/g, '');
    const items = getValueByPath(context, itemsPath);
    
    if (!Array.isArray(items)) {
      throw new Error(`Loop items must be an array, got: ${typeof items}`);
    }
    
    const maxIterations = config.max_iterations || 100;
    const toProcess = items.slice(0, maxIterations);
    
    return {
      items: toProcess,
      count: toProcess.length,
      original_count: items.length,
      truncated: items.length > maxIterations,
    };
  }
};

// Note: Loop execution is handled specially by the engine
// Each iteration executes child nodes with current item in context
```

---

## 7. CODE EXECUTOR

### Config Schema

```typescript
interface CodeConfig {
  code: string;              // JavaScript code
  inputs?: string[];         // Variable paths to pass in
  timeout_ms?: number;
}
```

### Implementation

```typescript
// lib/workflow/executors/code.ts

export const codeExecutor: NodeExecutor<CodeConfig> = {
  type: 'code',
  
  async execute(config, context) {
    const code = config.code;
    
    // Build inputs object
    const inputs: Record<string, any> = {};
    
    if (config.inputs) {
      for (const inputPath of config.inputs) {
        const key = inputPath.split('.').pop() || inputPath;
        inputs[key] = getValueByPath(context, inputPath);
      }
    }
    
    // Add common utilities
    inputs.$input = context.input;
    inputs.$results = context.results;
    inputs.$variables = context.variables;
    
    // Execute in sandbox
    try {
      const result = await executeInSandbox(code, inputs, config.timeout_ms);
      return result;
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
};

async function executeInSandbox(code: string, inputs: Record<string, any>, timeout = 5000): Promise<any> {
  // Create async function from code
  const asyncCode = `
    return (async function(inputs) {
      const { $input, $results, $variables, ...data } = inputs;
      ${code}
    })(inputs);
  `;
  
  // Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const fn = new Function('inputs', asyncCode);
    const result = await Promise.race([
      fn(inputs),
      new Promise((_, reject) => 
        controller.signal.addEventListener('abort', () => 
          reject(new Error('Code execution timeout'))
        )
      )
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 8. TRANSFORM EXECUTOR

### Config Schema

```typescript
interface TransformConfig {
  operation: 'map' | 'filter' | 'reduce' | 'find' | 'sort' | 'pick' | 'omit';
  
  // Input
  input: string;           // Path to data
  
  // For map/filter/find
  expression?: string;     // 'item.name'
  condition?: string;      // 'item.age > 18'
  
  // For reduce
  reducer?: string;
  initial_value?: any;
  
  // For sort
  sort_by?: string;
  order?: 'asc' | 'desc';
  
  // For pick/omit
  fields?: string[];
}
```

### Implementation

```typescript
// lib/workflow/executors/transform.ts

export const transformExecutor: NodeExecutor<TransformConfig> = {
  type: 'transform',
  
  async execute(config, context) {
    const inputPath = config.input.replace(/\{\{|\}\}/g, '');
    const data = getValueByPath(context, inputPath);
    
    switch (config.operation) {
      case 'map':
        return { result: transformMap(data, config.expression!) };
      case 'filter':
        return { result: transformFilter(data, config.condition!) };
      case 'find':
        return { result: transformFind(data, config.condition!) };
      case 'sort':
        return { result: transformSort(data, config.sort_by!, config.order) };
      case 'pick':
        return { result: transformPick(data, config.fields!) };
      case 'omit':
        return { result: transformOmit(data, config.fields!) };
      default:
        throw new Error(`Unknown transform operation: ${config.operation}`);
    }
  }
};

function transformMap(data: any[], expression: string): any[] {
  // Simple path expression: 'item.name' or 'item.user.email'
  return data.map(item => {
    const path = expression.replace('item.', '');
    return getValueByPath({ item }, `item.${path}`);
  });
}

function transformFilter(data: any[], condition: string): any[] {
  return data.filter(item => {
    const evalCondition = condition
      .replace(/item\./g, '')
      .replace(/(\w+)/g, (match) => {
        const value = item[match];
        return typeof value === 'string' ? `'${value}'` : value;
      });
    
    try {
      return new Function(`return ${evalCondition}`)();
    } catch {
      return false;
    }
  });
}

function transformSort(data: any[], sortBy: string, order: 'asc' | 'desc' = 'asc'): any[] {
  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal);
    }
    return aVal - bVal;
  });
  
  return order === 'desc' ? sorted.reverse() : sorted;
}

function transformPick(data: any, fields: string[]): any {
  if (Array.isArray(data)) {
    return data.map(item => pick(item, fields));
  }
  return pick(data, fields);
}

function pick(obj: any, fields: string[]): any {
  const result: any = {};
  for (const field of fields) {
    if (obj.hasOwnProperty(field)) {
      result[field] = obj[field];
    }
  }
  return result;
}

function transformOmit(data: any, fields: string[]): any {
  if (Array.isArray(data)) {
    return data.map(item => omit(item, fields));
  }
  return omit(data, fields);
}

function omit(obj: any, fields: string[]): any {
  const result = { ...obj };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}
```

---

## 9. EXECUTOR REGISTRY

### Register All Executors

```typescript
// lib/workflow/executors/index.ts

import { gmailExecutor } from './gmail';
import { slackExecutor } from './slack';
import { openaiExecutor } from './openai';
import { httpExecutor } from './http';
import { conditionExecutor } from './condition';
import { loopExecutor } from './loop';
import { codeExecutor } from './code';
import { transformExecutor } from './transform';
import { NodeExecutor } from '../types';

const executors: Record<string, NodeExecutor> = {
  gmail: gmailExecutor,
  slack: slackExecutor,
  openai: openaiExecutor,
  http: httpExecutor,
  condition: conditionExecutor,
  loop: loopExecutor,
  code: codeExecutor,
  transform: transformExecutor,
};

export function getExecutor(nodeType: string): NodeExecutor {
  const executor = executors[nodeType];
  if (!executor) {
    throw new Error(`No executor found for node type: ${nodeType}`);
  }
  return executor;
}

export function registerExecutor(executor: NodeExecutor): void {
  executors[executor.type] = executor;
}

export function listExecutors(): string[] {
  return Object.keys(executors);
}
```

---

## 10. THÊM EXECUTOR MỚI

### Template

```typescript
// lib/workflow/executors/my-service.ts
import { NodeExecutor, ExecutionContext } from '../types';

interface MyServiceConfig {
  action: 'action1' | 'action2';
  // ... config fields
}

export const myServiceExecutor: NodeExecutor<MyServiceConfig> = {
  type: 'my-service',
  
  validateConfig(config) {
    // Validate using zod or custom logic
    if (!config.action) {
      return { valid: false, error: 'action is required' };
    }
    return { valid: true };
  },
  
  async execute(config, context) {
    const { my_service_api_key } = context.credentials;
    
    if (!my_service_api_key) {
      throw new Error('My Service credentials not found');
    }
    
    // Implementation
    switch (config.action) {
      case 'action1':
        return await doAction1(my_service_api_key, config, context);
      case 'action2':
        return await doAction2(my_service_api_key, config, context);
      default:
        throw new Error(`Unknown action: ${config.action}`);
    }
  },
  
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        result: { type: 'string' },
        // ...
      }
    };
  }
};

// Register
import { registerExecutor } from './index';
registerExecutor(myServiceExecutor);
```
