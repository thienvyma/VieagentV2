-- Phase 7: Execution Logs Updates
-- Table 'execution_logs' already exists from init_v2.sql
-- We need to add missing columns for Phase 7 features

DO $$ 
BEGIN 
    -- Add error_message if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'execution_logs' AND column_name = 'error_message') THEN
        ALTER TABLE public.execution_logs ADD COLUMN error_message TEXT;
    END IF;

    -- Add completed_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'execution_logs' AND column_name = 'completed_at') THEN
        ALTER TABLE public.execution_logs ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Add external_chat_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'execution_logs' AND column_name = 'external_chat_id') THEN
        ALTER TABLE public.execution_logs ADD COLUMN external_chat_id TEXT;
    END IF;

    -- Add external_session_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'execution_logs' AND column_name = 'external_session_id') THEN
        ALTER TABLE public.execution_logs ADD COLUMN external_session_id TEXT;
    END IF;

    -- Ensure indexes exist
    CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_id ON execution_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
END $$;
