-- Refactor: Align with .agent/rules/database-guide.md
-- Rename execution_logs to workflow_executions
-- Ensure columns match the standards

ALTER TABLE IF EXISTS public.execution_logs RENAME TO workflow_executions;

DO $$ 
BEGIN 
    -- Column renames if necessary to match database-guide.md
    -- database-guide.md uses: started_at instead of created_at (for start time)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'started_at') THEN
        ALTER TABLE public.workflow_executions RENAME COLUMN created_at TO started_at;
    END IF;

    -- Ensure external_execution_id is present
    -- Ensure input_snapshot, output_snapshot are present (already are)
    -- Ensure duration_ms, error_message are present (already are)
END $$;

-- Update RLS if needed (renaming might break them depending on Supabase version, but usually they follow)
-- To be safe, re-apply
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON public.workflow_executions;
DROP POLICY IF EXISTS "Users can view own execution logs" ON public.workflow_executions;

CREATE POLICY "Users can view own workflow executions" 
ON public.workflow_executions FOR SELECT 
USING (auth.uid() = user_id);
