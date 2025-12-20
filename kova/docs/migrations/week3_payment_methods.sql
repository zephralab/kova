-- Week 3: Add Payment Methods to Users Table
-- This migration adds bank account and payment details to the users table

-- Add payment method fields to users table (one column at a time for compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bank_account_holder_name') THEN
        ALTER TABLE users ADD COLUMN bank_account_holder_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bank_name') THEN
        ALTER TABLE users ADD COLUMN bank_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_number') THEN
        ALTER TABLE users ADD COLUMN account_number TEXT; -- Will be encrypted at application level
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ifsc_code') THEN
        ALTER TABLE users ADD COLUMN ifsc_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_type') THEN
        ALTER TABLE users ADD COLUMN account_type VARCHAR(10) CHECK (account_type IN ('savings', 'current'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='upi_id') THEN
        ALTER TABLE users ADD COLUMN upi_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='payment_methods_updated_at') THEN
        ALTER TABLE users ADD COLUMN payment_methods_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_payment_methods_updated ON users(payment_methods_updated_at);

-- Add reference field to milestone_payments for manual payment tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='milestone_payments' AND column_name='reference') THEN
        ALTER TABLE milestone_payments ADD COLUMN reference TEXT; -- Transaction ID, UTR, or confirmation number
    END IF;
END $$;

-- Note: Account number encryption should be handled at the application level
-- using environment variables or a key management service

