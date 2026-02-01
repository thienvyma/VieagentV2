-- Phase 4: Customer Workspace Tables
-- Run this in Supabase SQL Editor

-- 1. One-Time Purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount paid in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  UNIQUE(user_id, agent_id) -- Prevent duplicate purchases
);

-- 2. Subscriptions (Simple Model)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR,
  status VARCHAR(20) NOT NULL, -- active, past_due, canceled
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id) -- One sub per agent per user
);

-- RLS Policies
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
