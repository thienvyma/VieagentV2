# 📦 TEMPLATES SYSTEM - VieAgent.vn

**Mô tả**: Template marketplace + n8n import capability

---

## 📋 MỤC LỤC

1. [Template Overview](#1-template-overview)
2. [Database Schema](#2-database-schema)
3. [Template Categories](#3-template-categories)
4. [n8n Import](#4-n8n-import)
5. [Template APIs](#5-template-apis)
6. [UI Components](#6-ui-components)

---

## 1. TEMPLATE OVERVIEW

### What is a Template?
Template là pre-built workflow mà users có thể:
- Browse trong gallery
- Preview trước khi dùng
- One-click deploy vào account
- Customize sau khi deploy

### Template Flow
```
Developer tạo → Publish template → User browse → Deploy → Customize → Use
```

---

## 2. DATABASE SCHEMA

### workflow_templates table
```sql
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Template content
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  trigger_config JSONB,
  input_schema JSONB,
  
  -- Categorization
  category VARCHAR(50) NOT NULL,
  tags TEXT[],
  use_case VARCHAR(100),
  
  -- Required integrations
  required_credentials TEXT[], -- ['gmail', 'slack', 'openai']
  
  -- Visuals
  icon VARCHAR(50),
  color VARCHAR(20),
  cover_image TEXT,
  screenshots TEXT[],
  
  -- Stats
  deploy_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending, approved, rejected
  
  -- Source
  source VARCHAR(50) DEFAULT 'internal', -- internal, n8n_import, community
  source_url TEXT, -- n8n share link
  
  -- Author
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_templates_category ON workflow_templates(category);
CREATE INDEX idx_templates_status ON workflow_templates(status);
CREATE INDEX idx_templates_tags ON workflow_templates USING GIN(tags);
CREATE INDEX idx_templates_search ON workflow_templates 
  USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### template_deploys table
```sql
CREATE TABLE template_deploys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workflow_templates(id),
  user_id UUID REFERENCES users(id),
  workflow_id UUID REFERENCES workflows(id), -- Resulting workflow
  deployed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. TEMPLATE CATEGORIES

### Business Automation
- Email Management (Gmail inbox cleanup)
- Lead Generation (LinkedIn → CRM)
- Customer Support (Ticket routing)
- Invoice Processing
- Appointment Scheduling

### AI & Content
- Content Generation (Blog writer)
- Social Media (Auto-posting)
- Summarization (Meeting notes)
- Language Translation
- Image Generation

### Developer Tools
- GitHub Notifications
- CI/CD Alerts
- Error Monitoring
- API Sync
- Database Backup

### E-commerce
- Order Notifications
- Inventory Alerts
- Review Management
- Price Monitoring
- Shipping Updates

### Personal Productivity
- Daily Digest
- Task Reminders
- Note Taking
- Calendar Sync
- Habit Tracking

```typescript
export const TEMPLATE_CATEGORIES = [
  { id: 'business', name: 'Business Automation', icon: 'Briefcase' },
  { id: 'ai', name: 'AI & Content', icon: 'Brain' },
  { id: 'developer', name: 'Developer Tools', icon: 'Code' },
  { id: 'ecommerce', name: 'E-commerce', icon: 'ShoppingCart' },
  { id: 'productivity', name: 'Personal Productivity', icon: 'CheckSquare' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone' },
  { id: 'hr', name: 'Human Resources', icon: 'Users' },
  { id: 'finance', name: 'Finance', icon: 'DollarSign' },
] as const;
```

---

## 4. N8N IMPORT

### n8n Workflow JSON Structure
```json
{
  "name": "Email Digest",
  "nodes": [
    {
      "parameters": {},
      "id": "uuid",
      "name": "Gmail Trigger",
      "type": "n8n-nodes-base.gmailTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "gmailOAuth2Api": {
          "id": "1",
          "name": "Gmail account"
        }
      }
    },
    {
      "parameters": {
        "model": "gpt-4",
        "prompt": "Summarize this email: {{$json.body}}"
      },
      "id": "uuid",
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1.4,
      "position": [450, 300],
      "credentials": {
        "openAiApi": {
          "id": "2",
          "name": "OpenAI API"
        }
      }
    }
  ],
  "connections": {
    "Gmail Trigger": {
      "main": [
        [
          {
            "node": "OpenAI",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### n8n to VieAgent Mapper
```typescript
// lib/workflow/n8n-import.ts

interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
}

interface N8nNode {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  position: [number, number];
  credentials?: Record<string, { id: string; name: string }>;
}

// n8n node type to VieAgent node type mapping
const NODE_TYPE_MAP: Record<string, string> = {
  'n8n-nodes-base.gmailTrigger': 'trigger_gmail',
  'n8n-nodes-base.gmail': 'gmail',
  'n8n-nodes-base.slackTrigger': 'trigger_slack',
  'n8n-nodes-base.slack': 'slack',
  'n8n-nodes-base.openAi': 'openai',
  'n8n-nodes-base.httpRequest': 'http',
  'n8n-nodes-base.if': 'condition',
  'n8n-nodes-base.set': 'transform',
  'n8n-nodes-base.code': 'code',
  'n8n-nodes-base.merge': 'merge',
  'n8n-nodes-base.splitInBatches': 'split',
  'n8n-nodes-base.wait': 'wait',
  'n8n-nodes-base.errorTrigger': 'error_handler',
  // Add more mappings...
};

// Credential type mapping
const CREDENTIAL_MAP: Record<string, string> = {
  'gmailOAuth2Api': 'gmail',
  'slackApi': 'slack',
  'openAiApi': 'openai',
  'httpBasicAuth': 'http_basic',
  // Add more...
};

export async function importN8nWorkflow(n8nJson: N8nWorkflow): Promise<{
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  requiredCredentials: string[];
  unsupportedNodes: string[];
}> {
  const nodes: ReactFlowNode[] = [];
  const edges: ReactFlowEdge[] = [];
  const requiredCredentials = new Set<string>();
  const unsupportedNodes: string[] = [];
  
  // Map nodes
  for (const n8nNode of n8nJson.nodes) {
    const vieagentType = NODE_TYPE_MAP[n8nNode.type];
    
    if (!vieagentType) {
      unsupportedNodes.push(n8nNode.type);
      continue;
    }
    
    // Map parameters
    const config = mapParameters(n8nNode.type, n8nNode.parameters);
    
    // Map credentials
    if (n8nNode.credentials) {
      for (const [credType] of Object.entries(n8nNode.credentials)) {
        const vieagentCred = CREDENTIAL_MAP[credType];
        if (vieagentCred) {
          requiredCredentials.add(vieagentCred);
        }
      }
    }
    
    nodes.push({
      id: n8nNode.id,
      type: vieagentType,
      position: { x: n8nNode.position[0], y: n8nNode.position[1] },
      data: {
        label: n8nNode.name,
        config,
      },
    });
  }
  
  // Map connections to edges
  for (const [sourceNode, outputs] of Object.entries(n8nJson.connections)) {
    const sourceId = n8nJson.nodes.find(n => n.name === sourceNode)?.id;
    if (!sourceId) continue;
    
    for (const connections of outputs.main) {
      for (const conn of connections) {
        const targetId = n8nJson.nodes.find(n => n.name === conn.node)?.id;
        if (!targetId) continue;
        
        edges.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle: `output-${conn.index}`,
          targetHandle: 'input',
        });
      }
    }
  }
  
  return {
    nodes,
    edges,
    requiredCredentials: Array.from(requiredCredentials),
    unsupportedNodes,
  };
}

// Map n8n parameters to VieAgent config
function mapParameters(n8nType: string, params: Record<string, any>): Record<string, any> {
  switch (n8nType) {
    case 'n8n-nodes-base.openAi':
      return {
        model: params.model || 'gpt-3.5-turbo',
        action: 'chat',
        messages: [{ role: 'user', content: params.prompt }],
        temperature: params.temperature || 0.7,
      };
      
    case 'n8n-nodes-base.gmail':
      return {
        action: params.operation || 'send',
        to: params.toAddresses?.join(', '),
        subject: params.subject,
        body: params.text || params.html,
        html: !!params.html,
      };
      
    case 'n8n-nodes-base.httpRequest':
      return {
        method: params.method || 'GET',
        url: params.url,
        headers: params.headers || {},
        body: params.body,
        responseType: params.responseFormat || 'json',
      };
      
    // Add more mappings...
    default:
      return params;
  }
}
```

### Variable Syntax Conversion
```typescript
// n8n: {{$json.email}} or {{$node["Gmail"].json.body}}
// VieAgent: {{gmail.body}} or {{input.email}}

function convertN8nVariables(expression: string, nodeMapping: Map<string, string>): string {
  // Convert $json references
  let result = expression.replace(
    /\{\{\$json\.(\w+)\}\}/g, 
    (_, field) => `{{input.${field}}}`
  );
  
  // Convert $node references
  result = result.replace(
    /\{\{\$node\["([^"]+)"\]\.json\.(\w+)\}\}/g,
    (_, nodeName, field) => {
      const nodeId = nodeMapping.get(nodeName);
      return `{{${nodeId}.${field}}}`;
    }
  );
  
  return result;
}
```

---

## 5. TEMPLATE APIs

### List Templates
```typescript
// GET /api/templates?category=business&search=email

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  
  let query = supabase
    .from('workflow_templates')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('deploy_count', { ascending: false });
  
  if (category) query = query.eq('category', category);
  if (search) query = query.textSearch('name', search);
  
  const { data, count, error } = await query
    .range((page - 1) * limit, page * limit - 1);
  
  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total: count },
  });
}
```

### Deploy Template
```typescript
// POST /api/templates/[id]/deploy

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  
  // Get template
  const { data: template } = await supabase
    .from('workflow_templates')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }
  
  // Check required credentials
  const { data: userCredentials } = await supabase
    .from('credentials')
    .select('provider')
    .eq('user_id', user.id);
  
  const userProviders = userCredentials?.map(c => c.provider) || [];
  const missingCredentials = template.required_credentials.filter(
    (c: string) => !userProviders.includes(c)
  );
  
  if (missingCredentials.length > 0) {
    return Response.json({
      success: false,
      error: 'Missing credentials',
      missingCredentials,
    }, { status: 400 });
  }
  
  // Create workflow from template
  const { data: workflow } = await supabase
    .from('workflows')
    .insert({
      name: `${template.name} (Copy)`,
      description: template.description,
      developer_id: user.id,
      nodes: template.nodes,
      edges: template.edges,
      trigger_config: template.trigger_config,
      input_schema: template.input_schema,
      status: 'draft',
      source_template_id: template.id,
    })
    .select()
    .single();
  
  // Increment deploy count
  await supabase.rpc('increment_template_deploys', { template_id: template.id });
  
  // Log deploy
  await supabase.from('template_deploys').insert({
    template_id: template.id,
    user_id: user.id,
    workflow_id: workflow.id,
  });
  
  return Response.json({
    success: true,
    data: { workflowId: workflow.id },
  });
}
```

### Import n8n Template
```typescript
// POST /api/templates/import-n8n

export async function POST(request: Request) {
  const user = await getAuthUser();
  const { n8nJson, name, category } = await request.json();
  
  // Parse and convert n8n workflow
  const { nodes, edges, requiredCredentials, unsupportedNodes } = 
    await importN8nWorkflow(n8nJson);
  
  if (unsupportedNodes.length > 0) {
    return Response.json({
      success: false,
      error: 'Some nodes are not supported',
      unsupportedNodes,
    }, { status: 400 });
  }
  
  // Create template
  const { data: template } = await supabase
    .from('workflow_templates')
    .insert({
      name,
      description: n8nJson.name,
      nodes,
      edges,
      category,
      required_credentials: requiredCredentials,
      source: 'n8n_import',
      author_id: user.id,
      status: 'draft', // Needs review
    })
    .select()
    .single();
  
  return Response.json({
    success: true,
    data: template,
  });
}
```

---

## 6. UI COMPONENTS

### TemplateGallery.tsx
```typescript
// components/templates/TemplateGallery.tsx

export function TemplateGallery() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { data: templates, isLoading } = useTemplates({ category, search });
  
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <CategoryPill active={category === 'all'} onClick={() => setCategory('all')}>
          All
        </CategoryPill>
        {TEMPLATE_CATEGORIES.map(cat => (
          <CategoryPill 
            key={cat.id}
            active={category === cat.id}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </CategoryPill>
        ))}
      </div>
      
      {/* Search */}
      <Input
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search />}
      />
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
```

### TemplateCard.tsx
```typescript
// components/templates/TemplateCard.tsx

export function TemplateCard({ template }: { template: Template }) {
  const [deploying, setDeploying] = useState(false);
  const router = useRouter();
  
  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const result = await deployTemplate(template.id);
      router.push(`/developer/workflows/${result.workflowId}`);
    } catch (error) {
      if (error.missingCredentials) {
        // Show credential setup modal
      }
    } finally {
      setDeploying(false);
    }
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: template.color }}
          >
            <Icon name={template.icon} className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{template.category}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.short_description}
        </p>
        
        {/* Required integrations */}
        <div className="flex gap-2 mt-4">
          {template.required_credentials.map(cred => (
            <CredentialBadge key={cred} provider={cred} />
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {template.deploy_count}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {template.rating?.toFixed(1) || 'N/A'}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1">
          Preview
        </Button>
        <Button className="flex-1" onClick={handleDeploy} loading={deploying}>
          Deploy
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### N8nImportModal.tsx
```typescript
// components/templates/N8nImportModal.tsx

export function N8nImportModal({ open, onClose }: Props) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  
  const handleParse = () => {
    try {
      const json = JSON.parse(jsonInput);
      const result = parseN8nWorkflow(json);
      setPreview(result);
      setError(null);
    } catch (e) {
      setError('Invalid JSON format');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from n8n</DialogTitle>
          <DialogDescription>
            Paste your n8n workflow JSON to import it as a template.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Paste n8n workflow JSON here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {preview && (
            <div className="space-y-2">
              <h4 className="font-semibold">Preview</h4>
              <div className="flex gap-2">
                <Badge>{preview.nodes.length} nodes</Badge>
                <Badge>{preview.edges.length} connections</Badge>
              </div>
              
              {preview.unsupportedNodes.length > 0 && (
                <Alert variant="warning">
                  <AlertDescription>
                    Unsupported nodes: {preview.unsupportedNodes.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <span className="text-sm">Required:</span>
                {preview.requiredCredentials.map(cred => (
                  <CredentialBadge key={cred} provider={cred} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleParse} disabled={!jsonInput}>
            Parse
          </Button>
          {preview && (
            <Button onClick={() => importTemplate(preview)}>
              Import Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📋 SAMPLE TEMPLATES

### 1. Email Digest (Gmail → OpenAI → Slack)
```json
{
  "name": "Daily Email Digest",
  "category": "productivity",
  "description": "Get a daily summary of important emails in Slack",
  "required_credentials": ["gmail", "openai", "slack"],
  "nodes": [
    { "type": "trigger_schedule", "config": { "cron": "0 9 * * 1-5" }},
    { "type": "gmail", "config": { "action": "search", "query": "is:unread" }},
    { "type": "openai", "config": { "model": "gpt-4", "action": "chat" }},
    { "type": "slack", "config": { "action": "send", "channel": "#daily-digest" }}
  ]
}
```

### 2. Lead Capture (Webhook → Database → Email)
```json
{
  "name": "Lead Capture Form",
  "category": "business",
  "required_credentials": ["gmail"],
  "nodes": [
    { "type": "trigger_webhook" },
    { "type": "database", "config": { "action": "insert", "table": "leads" }},
    { "type": "gmail", "config": { "action": "send" }}
  ]
}
```

### 3. AI Content Generator
```json
{
  "name": "Blog Post Generator",
  "category": "ai",
  "required_credentials": ["openai"],
  "nodes": [
    { "type": "trigger_manual", "config": { "inputSchema": { "fields": [
      { "name": "topic", "type": "text", "required": true }
    ]}}},
    { "type": "openai", "config": { "action": "chat", "model": "gpt-4" }},
    { "type": "http", "config": { "method": "POST", "url": "{{input.webhook_url}}" }}
  ]
}
```

---

## ⚠️ NOTES

1. **n8n Import Limitations**:
   - Not all n8n nodes are supported
   - Complex expressions may not convert perfectly
   - Custom code nodes need manual review

2. **Template Security**:
   - Templates are sandboxed
   - Credentials are NOT included in templates
   - Users must provide their own credentials

3. **Template Review Process**:
   - Community templates go through approval
   - Internal templates can be auto-approved
   - n8n imports start as drafts
