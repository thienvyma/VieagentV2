-- Migration: Fix Admin RLS Policies
-- Date: 2026-02-01
-- Description: Allows users with 'admin' role to SELECT from public.users table.

-- 1. Drop existing policy if it conflicts (optional, but safer to be explicit)
-- DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 2. Create the Admin Policy
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 3. Ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
