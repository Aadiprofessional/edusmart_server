-- Subscription System Database Schema for Supabase
-- Run these commands in your Supabase SQL editor

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL, -- 30 for monthly, 365 for yearly
  response_limit INTEGER NOT NULL DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, cancelled
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  responses_remaining INTEGER NOT NULL DEFAULT 500,
  responses_total INTEGER NOT NULL DEFAULT 500,
  last_response_refresh TIMESTAMP WITH TIME ZONE,
  is_pro BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_responses table (track individual response usage)
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  response_type VARCHAR(100) NOT NULL, -- 'course_query', 'scholarship_query', etc.
  query_data JSONB, -- store the actual query/response data
  responses_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create subscription_transactions table
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'renewal', 'addon'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255), -- external payment processor transaction ID
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- pending, completed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create addon_plans table
CREATE TABLE IF NOT EXISTS addon_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  additional_responses INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_addons table
CREATE TABLE IF NOT EXISTS user_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addon_plans(id),
  responses_added INTEGER NOT NULL DEFAULT 50,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, used
  expires_at TIMESTAMP WITH TIME ZONE, -- expires when new responses are given
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create response_usage_logs table (detailed logging)
CREATE TABLE IF NOT EXISTS response_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  addon_id UUID REFERENCES user_addons(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'used', 'added', 'expired', 'renewed'
  responses_count INTEGER NOT NULL,
  remaining_responses INTEGER NOT NULL,
  description TEXT,
  metadata JSONB, -- additional data about the usage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, response_limit) VALUES
('Monthly Pro', 'Monthly subscription with 500 responses', 9.99, 30, 500),
('Yearly Pro', 'Yearly subscription with 500 responses per month', 99.99, 365, 500);

-- Insert default addon plan
INSERT INTO addon_plans (name, description, price, additional_responses) VALUES
('Extra Responses', 'Add 50 additional responses to your current plan', 4.99, 50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_user_responses_user_id ON user_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_subscription_id ON user_responses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_user_id ON user_addons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_subscription_id ON user_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_response_usage_logs_user_id ON response_usage_logs(user_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

-- RLS Policies for user_subscriptions (users can only see their own)
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_responses (users can only see their own)
CREATE POLICY "Users can view their own responses" ON user_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own responses" ON user_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_transactions (users can only see their own)
CREATE POLICY "Users can view their own transactions" ON subscription_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON subscription_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for addon_plans (public read)
CREATE POLICY "Anyone can view addon plans" ON addon_plans FOR SELECT USING (true);

-- RLS Policies for user_addons (users can only see their own)
CREATE POLICY "Users can view their own addons" ON user_addons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addons" ON user_addons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addons" ON user_addons FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for response_usage_logs (users can only see their own)
CREATE POLICY "Users can view their own usage logs" ON response_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage logs" ON response_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addon_plans_updated_at BEFORE UPDATE ON addon_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh user responses (called monthly for yearly subscriptions)
CREATE OR REPLACE FUNCTION refresh_user_responses()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by a scheduled job
    -- Update user subscriptions that need response refresh
    UPDATE user_subscriptions 
    SET 
        responses_remaining = responses_total,
        last_response_refresh = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date > NOW()
        AND (
            -- Monthly subscriptions don't need refresh (they get new subscription)
            -- Yearly subscriptions need refresh every 30 days
            (last_response_refresh IS NULL AND start_date <= NOW() - INTERVAL '30 days')
            OR 
            (last_response_refresh IS NOT NULL AND last_response_refresh <= NOW() - INTERVAL '30 days')
        );
    
    -- Expire addons when responses are refreshed
    UPDATE user_addons 
    SET 
        status = 'expired',
        expires_at = NOW()
    WHERE 
        status = 'active' 
        AND subscription_id IN (
            SELECT id FROM user_subscriptions 
            WHERE last_response_refresh = NOW()
        );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update expired subscriptions
    UPDATE user_subscriptions 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql; 