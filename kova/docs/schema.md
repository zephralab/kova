# Database Schema Design

## Overview
Using Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenant architecture.

## Core Tables

### users (Designer accounts)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  razorpay_key_id TEXT, -- Encrypted
  razorpay_key_secret TEXT, -- Encrypted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Users can only access their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Client info
  client_name TEXT NOT NULL,
  client_contact TEXT, -- Phone/email
  
  -- Project details
  project_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Sharing
  share_uuid UUID UNIQUE DEFAULT uuid_generate_v4(), -- For public link
  share_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_share_uuid ON projects(share_uuid);

-- RLS: Users can only access their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Public access for shareable links (read-only)
CREATE POLICY "Public can view shared projects" ON projects 
  FOR SELECT 
  USING (share_enabled = TRUE);
```

### milestones
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone details
  title TEXT NOT NULL, -- e.g., "Advance Payment", "Design Approval"
  description TEXT,
  amount DECIMAL(12,2) NOT NULL, -- Expected total amount for this milestone
  percentage DECIMAL(5,2), -- Optional: percentage of total
  order_index INTEGER NOT NULL, -- For ordering milestones
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')),
  amount_paid DECIMAL(12,2) DEFAULT 0, -- Total amount received so far
  
  -- Timestamps
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE, -- When milestone fully paid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_order ON milestones(project_id, order_index);

-- RLS: Users can access milestones of their projects
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestones" ON milestones 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own milestones" ON milestones 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own milestones" ON milestones 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own milestones" ON milestones 
  FOR DELETE 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Public access for shareable links (read-only)
CREATE POLICY "Public can view shared milestones" ON milestones 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE share_enabled = TRUE
    )
  );
```

### milestone_payments (tracks partial payments)
```sql
CREATE TABLE milestone_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(12,2) NOT NULL,
  payment_link_url TEXT, -- Razorpay payment link
  razorpay_payment_id TEXT, -- Set when payment succeeds
  razorpay_order_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestone_payments_milestone_id ON milestone_payments(milestone_id);
CREATE INDEX idx_milestone_payments_status ON milestone_payments(status);

-- RLS: Users can access payments of their milestones
ALTER TABLE milestone_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestone payments" ON milestone_payments 
  FOR SELECT 
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own milestone payments" ON milestone_payments 
  FOR INSERT 
  WITH CHECK (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE p.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own milestone payments" ON milestone_payments 
  FOR UPDATE 
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Public access for shareable links (read-only)
CREATE POLICY "Public can view shared milestone payments" ON milestone_payments 
  FOR SELECT 
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE p.share_enabled = TRUE
    )
  );
```

### expenses
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Expense details
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('materials', 'labor', 'transport', 'other')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Optional: Link to vendor/supplier
  vendor_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- RLS: Users can access expenses of their projects
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON expenses 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own expenses" ON expenses 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own expenses" ON expenses 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own expenses" ON expenses 
  FOR DELETE 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Public access for shareable links (read-only, aggregated by category)
CREATE POLICY "Public can view shared expenses" ON expenses 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM projects WHERE share_enabled = TRUE
    )
  );
```

## Useful Views

### project_summary (for dashboard)
```sql
CREATE VIEW project_summary AS
SELECT 
  p.id,
  p.user_id,
  p.project_name,
  p.client_name,
  p.total_amount,
  
  -- Milestone stats (using amount_paid from milestones)
  COALESCE(SUM(m.amount_paid), 0) as amount_received,
  COALESCE(SUM(CASE WHEN m.status IN ('pending', 'partially_paid') THEN (m.amount - m.amount_paid) ELSE 0 END), 0) as amount_pending,
  COUNT(CASE WHEN m.status = 'paid' THEN 1 END) as milestones_paid,
  COUNT(CASE WHEN m.status IN ('pending', 'partially_paid') THEN 1 END) as milestones_pending,
  
  -- Expense stats
  COALESCE(SUM(e.amount), 0) as total_expenses,
  
  -- Balance
  COALESCE(SUM(m.amount_paid), 0) - COALESCE(SUM(e.amount), 0) as balance,
  
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN milestones m ON m.project_id = p.id
LEFT JOIN expenses e ON e.project_id = p.id
GROUP BY p.id;
```

### expense_summary_by_category (for displaying category totals)
```sql
CREATE VIEW expense_summary_by_category AS
SELECT 
  project_id,
  category,
  COUNT(*) as expense_count,
  SUM(amount) as category_total
FROM expenses
GROUP BY project_id, category;
```

### milestone_templates (default templates for quick setup)
```sql
CREATE TABLE milestone_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE, -- System-provided templates
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system templates, user_id for custom
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE milestone_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES milestone_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  percentage DECIMAL(5,2) NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default templates
INSERT INTO milestone_templates (name, description, is_default) VALUES
  ('Design + Execution (4 stages)', 'Standard 4-milestone structure for design and execution projects', TRUE),
  ('Design Only (3 stages)', 'Simplified 3-milestone structure for design-only projects', TRUE);

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
```

## Database Functions

### record_milestone_payment (called by Razorpay webhook for partial payments)
```sql
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
```

### regenerate_share_link (revoke old link)
```sql
CREATE OR REPLACE FUNCTION regenerate_share_link(project_uuid UUID)
RETURNS UUID AS $$
DECLARE
  new_uuid UUID;
BEGIN
  new_uuid := uuid_generate_v4();
  UPDATE projects
  SET share_uuid = new_uuid, updated_at = NOW()
  WHERE id = project_uuid;
  RETURN new_uuid;
END;
$$ LANGUAGE plpgsql;
```

### get_next_milestone (check if next milestone can be requested)
```sql
CREATE OR REPLACE FUNCTION get_next_milestone(project_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_next_milestone_id UUID;
BEGIN
  -- Find the first unpaid milestone in order
  SELECT id INTO v_next_milestone_id
  FROM milestones
  WHERE project_id = project_uuid
    AND status IN ('pending', 'partially_paid')
  ORDER BY order_index ASC
  LIMIT 1;
  
  RETURN v_next_milestone_id;
END;
$$ LANGUAGE plpgsql;
```

### can_request_milestone_payment (business rule: previous must be fully paid)
```sql
CREATE OR REPLACE FUNCTION can_request_milestone_payment(milestone_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_project_id UUID;
  v_order_index INTEGER;
  v_previous_unpaid_count INTEGER;
BEGIN
  -- Get milestone details
  SELECT project_id, order_index INTO v_project_id, v_order_index
  FROM milestones
  WHERE id = milestone_uuid;
  
  -- Check if any previous milestone is not fully paid
  SELECT COUNT(*) INTO v_previous_unpaid_count
  FROM milestones
  WHERE project_id = v_project_id
    AND order_index < v_order_index
    AND status != 'paid';
  
  RETURN v_previous_unpaid_count = 0;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Initial Setup (SQL to run)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run all CREATE TABLE statements
-- Run all CREATE INDEX statements
-- Run all RLS policies
-- Run all views
-- Run all functions
```

## Future Schema Additions (V2)

### client_users (for client login in V2)
```sql
-- Deferred to V2
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### project_access (many-to-many for client access)
```sql
-- Deferred to V2
CREATE TABLE project_access (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES client_users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, client_user_id)
);
```

## Data Constraints & Validation

### Business Rules
1. **Milestone amounts must sum to total_amount:**
   - Validated in application layer (not DB constraint)
   - Warning shown if sum doesn't match

2. **Cannot request next milestone payment until previous is paid:**
   - Validated in application layer
   - Check milestone.order_index and status

3. **Cannot delete project with paid milestones:**
   - Soft delete recommended (add deleted_at column in future)
   - For MVP: Allow delete, show warning

4. **Share link security:**
   - UUID is cryptographically random (128-bit)
   - Rate limit public endpoints (100 requests/hour per IP)

## Backup Strategy
- Supabase automatic daily backups
- Point-in-time recovery available
- Manual export before major migrations

## Testing Data

### Seed Data for Development
```sql
-- Create test designer
INSERT INTO users (id, email, full_name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test Designer');

-- Create test project
INSERT INTO projects (user_id, client_name, project_name, total_amount)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Mr. Sharma', '3BHK Interior', 800000);

-- Add milestones
-- (Add sample milestones with test data)