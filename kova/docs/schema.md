-- ============================================
-- KOVA DATABASE SCHEMA - WITH FIRM SUPPORT
-- Version: 2.0 (Multi-tenant ready)
-- ============================================

-- Drop existing tables if you've already created them (ONLY FOR DEVELOPMENT!)
-- DROP VIEW IF EXISTS expense_summary_by_category CASCADE;
-- DROP VIEW IF EXISTS project_summary CASCADE;
-- DROP TABLE IF EXISTS milestone_template_items CASCADE;
-- DROP TABLE IF EXISTS milestone_templates CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS milestone_payments CASCADE;
-- DROP TABLE IF EXISTS milestones CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS firms CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. FIRMS TABLE (Designer Organizations) - NEW!
-- ============================================
CREATE TABLE firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  
  -- Subscription & Billing (for future)
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  subscription_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'), -- 14-day trial
  plan_type TEXT DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  
  -- Shared Razorpay account for firm (optional)
  razorpay_key_id TEXT, -- Encrypted
  razorpay_key_secret TEXT, -- Encrypted
  
  -- Settings
  max_users INTEGER DEFAULT 1, -- For future team limits
  max_projects INTEGER, -- NULL = unlimited
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_firms_subscription_status ON firms(subscription_status);

-- ============================================
-- 2. USERS TABLE (Now belongs to a firm)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE, -- NEW: Firm association
  
  -- User details
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  
  -- Role within firm (for future team features)
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  
  -- Personal Razorpay (overrides firm's if set)
  personal_razorpay_key_id TEXT,
  personal_razorpay_key_secret TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_firm_id ON users(firm_id);
CREATE INDEX idx_users_email ON users(email);

-- RLS: Users can only see members of their firm
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- FIXED: Non-recursive policy using SECURITY DEFINER function
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view firm members" ON users 
  FOR SELECT USING (
    firm_id = get_my_firm_id()
  );

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- ... [Rest of tables remain the same] ...

-- ============================================
-- 9. HELPER FUNCTIONS (RLS Bypass & Fixes)
-- ============================================

-- Helper to safely get firm_id without recursion (Used in RLS)
CREATE OR REPLACE FUNCTION get_my_firm_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM users WHERE id = auth.uid();
$$;

-- Emergency lookup for backend/auth (Bypasses RLS completely)
CREATE OR REPLACE FUNCTION force_get_firm_id(target_user_id UUID)
RETURNS TABLE (firm_id UUID) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT users.firm_id FROM users WHERE users.id = target_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_my_firm_id TO authenticated;
GRANT EXECUTE ON FUNCTION force_get_firm_id TO authenticated;

-- ============================================
-- GRANT PERMISSIONS FOR RLS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- 3. PROJECTS TABLE (Now belongs to firm, not individual user)
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE, -- NEW: Firm ownership
  created_by_user_id UUID NOT NULL REFERENCES users(id), -- NEW: Track creator
  assigned_to_user_id UUID REFERENCES users(id), -- NEW: Optional assignment (for teams)
  
  -- Client info
  client_name TEXT NOT NULL,
  client_contact TEXT, -- Phone/email/WhatsApp
  
  -- Project details
  project_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Status (for future)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
  
  -- Sharing
  share_uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
  share_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  started_at DATE DEFAULT CURRENT_DATE,
  expected_completion DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_firm_id ON projects(firm_id);
CREATE INDEX idx_projects_share_uuid ON projects(share_uuid);
CREATE INDEX idx_projects_created_by ON projects(created_by_user_id);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to_user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- RLS: Firm members can access their firm's projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Firm members can view projects" ON projects 
  FOR SELECT USING (
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );
CREATE POLICY "Firm members can create projects" ON projects 
  FOR INSERT WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );
CREATE POLICY "Firm members can update projects" ON projects 
  FOR UPDATE USING (
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );
CREATE POLICY "Firm members can delete projects" ON projects 
  FOR DELETE USING (
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );

-- Public access for shareable links
CREATE POLICY "Public can view shared projects" ON projects 
  FOR SELECT 
  USING (share_enabled = TRUE);

-- ============================================
-- 4. MILESTONES TABLE (No changes needed)
-- ============================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone details
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  order_index INTEGER NOT NULL,
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')),
  amount_paid DECIMAL(12,2) DEFAULT 0,
  
  -- Timestamps
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_order ON milestones(project_id, order_index);

-- RLS: Access through project's firm
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Firm members can view milestones" ON milestones 
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );
CREATE POLICY "Firm members can manage milestones" ON milestones 
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );

-- Public access for shareable links
CREATE POLICY "Public can view shared milestones" ON milestones 
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE share_enabled = TRUE
    )
  );

-- ============================================
-- 5. MILESTONE_PAYMENTS TABLE (No changes needed)
-- ============================================
CREATE TABLE milestone_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  payment_link_url TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  
  -- Tracking
  created_by_user_id UUID REFERENCES users(id), -- NEW: Track who created the payment link
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestone_payments_milestone_id ON milestone_payments(milestone_id);
CREATE INDEX idx_milestone_payments_status ON milestone_payments(status);
CREATE INDEX idx_milestone_payments_created_by ON milestone_payments(created_by_user_id);

-- RLS: Access through milestone's project's firm
ALTER TABLE milestone_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Firm members can view payments" ON milestone_payments 
  FOR SELECT USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );
CREATE POLICY "Firm members can manage payments" ON milestone_payments 
  FOR ALL USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );

-- Public access for shareable links
CREATE POLICY "Public can view shared payments" ON milestone_payments 
  FOR SELECT USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE p.share_enabled = TRUE
    )
  );

-- ============================================
-- 6. EXPENSES TABLE (Track who added expense)
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Expense details
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('materials', 'labor', 'transport', 'other')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_name TEXT,
  
  -- Tracking
  added_by_user_id UUID REFERENCES users(id), -- NEW: Track who added
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_added_by ON expenses(added_by_user_id);

-- RLS: Access through project's firm
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Firm members can view expenses" ON expenses 
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );
CREATE POLICY "Firm members can manage expenses" ON expenses 
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN users u ON u.firm_id = p.firm_id
      WHERE u.id = auth.uid()
    )
  );

-- Public access for shareable links (category totals only in view)
CREATE POLICY "Public can view shared expenses" ON expenses 
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE share_enabled = TRUE
    )
  );

-- ============================================
-- 7. MILESTONE TEMPLATES (Now firm-specific)
-- ============================================
CREATE TABLE milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE, -- NULL for system templates
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestone_templates_firm_id ON milestone_templates(firm_id);

-- RLS: Firm members see their templates + system templates
ALTER TABLE milestone_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View system and firm templates" ON milestone_templates 
  FOR SELECT USING (
    firm_id IS NULL OR -- System templates
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );
CREATE POLICY "Firm members can manage own templates" ON milestone_templates 
  FOR ALL USING (
    firm_id IN (
      SELECT firm_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 8. MILESTONE TEMPLATE ITEMS (No changes needed)
-- ============================================
CREATE TABLE milestone_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES milestone_templates(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  percentage DECIMAL(5,2) NOT NULL,
  order_index INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEWS (Updated for firm structure)
-- ============================================

-- Project Summary View
CREATE VIEW project_summary AS
SELECT 
  p.id,
  p.firm_id, -- NEW
  p.created_by_user_id,
  p.assigned_to_user_id,
  p.project_name,
  p.client_name,
  p.total_amount,
  p.status,
  
  -- Milestone stats
  COALESCE(SUM(DISTINCT m.amount_paid), 0) as amount_received,
  COALESCE(SUM(DISTINCT CASE WHEN m.status IN ('pending', 'partially_paid') THEN (m.amount - m.amount_paid) ELSE 0 END), 0) as amount_pending,
  COUNT(DISTINCT CASE WHEN m.status = 'paid' THEN m.id END) as milestones_paid,
  COUNT(DISTINCT CASE WHEN m.status IN ('pending', 'partially_paid') THEN m.id END) as milestones_pending,
  
  -- Expense stats
  COALESCE(SUM(DISTINCT e.amount), 0) as total_expenses,
  
  -- Balance
  COALESCE(SUM(DISTINCT m.amount_paid), 0) - COALESCE(SUM(DISTINCT e.amount), 0) as balance,
  
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN milestones m ON m.project_id = p.id
LEFT JOIN expenses e ON e.project_id = p.id
GROUP BY p.id;

-- Expense Summary by Category View
CREATE VIEW expense_summary_by_category AS
SELECT 
  project_id,
  category,
  COUNT(*) as expense_count,
  SUM(amount) as category_total
FROM expenses
GROUP BY project_id, category;

-- Firm Dashboard View (NEW - for future)
CREATE VIEW firm_dashboard AS
SELECT 
  f.id as firm_id,
  f.name as firm_name,
  f.subscription_status,
  
  -- User stats
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.role = 'owner' THEN u.id END) as owners,
  
  -- Project stats
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
  
  -- Financial stats
  COALESCE(SUM(p.total_amount), 0) as total_project_value,
  COALESCE(SUM(m.amount_paid), 0) as total_collected,
  
  f.created_at
FROM firms f
LEFT JOIN users u ON u.firm_id = f.id
LEFT JOIN projects p ON p.firm_id = f.id
LEFT JOIN milestones m ON m.project_id = p.id
GROUP BY f.id;

-- ============================================
-- FUNCTIONS (Updated for firm context)
-- ============================================

-- Function to create firm and owner user during signup
CREATE OR REPLACE FUNCTION create_firm_and_owner(
  auth_user_id UUID,
  user_email TEXT,
  user_name TEXT,
  firm_name TEXT DEFAULT NULL
)
RETURNS TABLE (firm_id UUID, user_id UUID) AS $$
DECLARE
  v_firm_id UUID;
  v_user_id UUID;
  v_firm_name TEXT;
BEGIN
  -- Use provided firm name or generate from user name
  v_firm_name := COALESCE(firm_name, user_name || '''s Studio');
  
  -- Create firm
  INSERT INTO firms (name)
  VALUES (v_firm_name)
  RETURNING id INTO v_firm_id;
  
  -- Create owner user
  INSERT INTO users (id, firm_id, email, full_name, role)
  VALUES (auth_user_id, v_firm_id, user_email, user_name, 'owner')
  RETURNING id INTO v_user_id;
  
  RETURN QUERY SELECT v_firm_id, v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Razorpay credentials (checks user first, then firm)
CREATE OR REPLACE FUNCTION get_razorpay_credentials(user_uuid UUID)
RETURNS TABLE (key_id TEXT, key_secret TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.personal_razorpay_key_id, f.razorpay_key_id) as key_id,
    COALESCE(u.personal_razorpay_key_secret, f.razorpay_key_secret) as key_secret
  FROM users u
  JOIN firms f ON f.id = u.firm_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record milestone payment (same as before)
CREATE OR REPLACE FUNCTION record_milestone_payment(
  payment_uuid UUID,
  razorpay_pay_id TEXT,
  razorpay_ord_id TEXT
)
RETURNS VOID AS $$
DECLARE
  v_milestone_id UUID;
  v_payment_amount DECIMAL(12,2);
  v_milestone_expected_amount DECIMAL(12,2);
  v_milestone_amount_paid DECIMAL(12,2);
  v_new_total DECIMAL(12,2);
BEGIN
  -- Mark payment as paid
  UPDATE milestone_payments
  SET 
    status = 'paid',
    razorpay_payment_id = razorpay_pay_id,
    razorpay_order_id = razorpay_ord_id,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = payment_uuid
  RETURNING milestone_id, amount INTO v_milestone_id, v_payment_amount;
  
  -- Get milestone details
  SELECT amount, amount_paid INTO v_milestone_expected_amount, v_milestone_amount_paid
  FROM milestones
  WHERE id = v_milestone_id;
  
  -- Calculate new total
  v_new_total := v_milestone_amount_paid + v_payment_amount;
  
  -- Update milestone
  IF v_new_total >= v_milestone_expected_amount THEN
    -- Fully paid
    UPDATE milestones
    SET 
      status = 'paid',
      amount_paid = v_milestone_expected_amount,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_milestone_id;
  ELSE
    -- Partially paid
    UPDATE milestones
    SET 
      status = 'partially_paid',
      amount_paid = v_new_total,
      updated_at = NOW()
    WHERE id = v_milestone_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (System templates available to all firms)
-- ============================================

-- Insert system templates (firm_id = NULL means available to all)
INSERT INTO milestone_templates (firm_id, name, description, is_default) VALUES
  (NULL, 'Design + Execution (4 stages)', 'Standard 4-milestone structure for design and execution projects', TRUE),
  (NULL, 'Design Only (3 stages)', 'Simplified 3-milestone structure for design-only projects', TRUE);

-- Template 1: Design + Execution
INSERT INTO milestone_template_items (template_id, title, description, percentage, order_index)
SELECT id, 'Advance Payment', 'Initial advance before starting', 40.00, 1 FROM milestone_templates WHERE name = 'Design + Execution (4 stages)'
UNION ALL
SELECT id, 'Design Approval', 'After client approves design concepts', 20.00, 2 FROM milestone_templates WHERE name = 'Design + Execution (4 stages)'
UNION ALL
SELECT id, 'Execution Start', 'Before starting physical execution work', 20.00, 3 FROM milestone_templates WHERE name = 'Design + Execution (4 stages)'
UNION ALL
SELECT id, 'Final Delivery', 'Upon project completion and handover', 20.00, 4 FROM milestone_templates WHERE name = 'Design + Execution (4 stages)';

-- Template 2: Design Only
INSERT INTO milestone_template_items (template_id, title, description, percentage, order_index)
SELECT id, 'Advance Payment', 'Initial advance before starting', 50.00, 1 FROM milestone_templates WHERE name = 'Design Only (3 stages)'
UNION ALL
SELECT id, 'Concept Approval', 'After client approves design concepts', 30.00, 2 FROM milestone_templates WHERE name = 'Design Only (3 stages)'
UNION ALL
SELECT id, 'Final Delivery', 'Upon delivery of final design files', 20.00, 3 FROM milestone_templates WHERE name = 'Design Only (3 stages)';

-- ============================================
-- GRANT PERMISSIONS FOR RLS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;