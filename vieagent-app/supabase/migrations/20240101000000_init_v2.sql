-- UUID extension not needed for gen_random_uuid()

-- 1. USERS Table (Links to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'customer', -- 'customer', 'admin'
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create public.users entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. AGENTS Table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Engine Mapping (V2)
  engine_type TEXT CHECK (engine_type IN ('flowise', 'activepieces')),
  engine_flow_id TEXT, -- ID of the flow in the Engine
  
  -- Easy Mode Configuration
  input_schema JSONB, -- Defines the Form UI
  required_credential_types TEXT[], -- e.g. ['openai', 'google_sheets']
  
  -- Marketplace info
  price_one_time DECIMAL(10,2) DEFAULT 0,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  author_id UUID REFERENCES public.users(id) -- if we want to track who made it (Admins)
);

-- RLS for agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public agents are viewable by everyone" ON public.agents FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can do everything with agents" ON public.agents USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);


-- 3. CREDENTIALS (The Vault)
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'openai', 'google', 'anthropic'
  key_name TEXT,
  encrypted_value TEXT NOT NULL, -- AES-256 encrypted
  iv TEXT NOT NULL, -- Initialization Vector
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for credentials
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own credentials" ON public.credentials USING (auth.uid() = user_id);


-- 4. EXECUTION LOGS
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  
  -- Status sync
  status TEXT DEFAULT 'pending', -- pending -> running -> success/failed
  external_execution_id TEXT, -- ID from Flowise/ActivePieces
  
  -- Data snapshot
  input_snapshot JSONB,
  output_snapshot JSONB,
  
  -- Metrics
  duration_ms INTEGER,
  credits_consumed INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for logs
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.execution_logs FOR SELECT USING (auth.uid() = user_id);
