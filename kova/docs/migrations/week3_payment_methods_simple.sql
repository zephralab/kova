-- Week 3: Add Payment Methods to Users Table (Simple Version)
-- Run this in Supabase SQL Editor

-- Add payment method fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_methods_updated_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for account_type (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_account_type_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_account_type_check 
        CHECK (account_type IN ('savings', 'current'));
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_payment_methods_updated ON users(payment_methods_updated_at);

-- Add reference field to milestone_payments
ALTER TABLE milestone_payments ADD COLUMN IF NOT EXISTS reference TEXT;

