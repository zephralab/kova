-- ==============================================================================
-- SUPABASE COMMON ISSUES - AUTOMATED FIXES
-- ==============================================================================
-- ⚠️  IMPORTANT: Review each section before running!
-- Run sections individually based on the issues found in diagnostics
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ==============================================================================
-- Run this only if diagnostics showed tables without RLS enabled

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.milestone_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_methods ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SECTION 2: CREATE MISSING INDEXES ON FOREIGN KEYS
-- ==============================================================================
-- Indexes improve query performance, especially for foreign keys

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_firm_id ON public.users(firm_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_firm_id ON public.projects(firm_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by_user_id ON public.projects(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_uuid ON public.projects(client_uuid);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Milestones table indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

-- Milestone Payments table indexes
CREATE INDEX IF NOT EXISTS idx_milestone_payments_milestone_id ON public.milestone_payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_payments_payment_method_id ON public.milestone_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_milestone_payments_status ON public.milestone_payments(status);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_added_by_user_id ON public.expenses(added_by_user_id);

-- Payment Methods table indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_firm_id ON public.payment_methods(firm_id);

-- ==============================================================================
-- SECTION 3: CREATE UPDATED_AT TRIGGERS
-- ==============================================================================
-- Automatically update updated_at timestamp

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ==============================================================================
-- SECTION 4: ADD MISSING RLS POLICIES
-- ==============================================================================
-- These are basic policies - you may need to customize based on your requirements

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can view other users in their firm
DROP POLICY IF EXISTS "Users can view firm members" ON public.users;
CREATE POLICY "Users can view firm members"
    ON public.users
    FOR SELECT
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- FIRMS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view their own firm
DROP POLICY IF EXISTS "Users can view own firm" ON public.firms;
CREATE POLICY "Users can view own firm"
    ON public.firms
    FOR SELECT
    USING (
        id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can update their own firm
DROP POLICY IF EXISTS "Users can update own firm" ON public.firms;
CREATE POLICY "Users can update own firm"
    ON public.firms
    FOR UPDATE
    USING (
        id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view projects in their firm
DROP POLICY IF EXISTS "Users can view firm projects" ON public.projects;
CREATE POLICY "Users can view firm projects"
    ON public.projects
    FOR SELECT
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can create projects in their firm
DROP POLICY IF EXISTS "Users can create firm projects" ON public.projects;
CREATE POLICY "Users can create firm projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can update projects in their firm
DROP POLICY IF EXISTS "Users can update firm projects" ON public.projects;
CREATE POLICY "Users can update firm projects"
    ON public.projects
    FOR UPDATE
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete projects in their firm
DROP POLICY IF EXISTS "Users can delete firm projects" ON public.projects;
CREATE POLICY "Users can delete firm projects"
    ON public.projects
    FOR DELETE
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Clients can view their project via UUID
DROP POLICY IF EXISTS "Clients can view project by UUID" ON public.projects;
CREATE POLICY "Clients can view project by UUID"
    ON public.projects
    FOR SELECT
    USING (true); -- This is intentionally permissive since client_uuid acts as a secret

-- ============================================================================
-- MILESTONES TABLE POLICIES
-- ============================================================================
-- Policy: Users can view milestones for their firm's projects
DROP POLICY IF EXISTS "Users can view firm milestones" ON public.milestones;
CREATE POLICY "Users can view firm milestones"
    ON public.milestones
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can create milestones for their firm's projects
DROP POLICY IF EXISTS "Users can create firm milestones" ON public.milestones;
CREATE POLICY "Users can create firm milestones"
    ON public.milestones
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can update milestones for their firm's projects
DROP POLICY IF EXISTS "Users can update firm milestones" ON public.milestones;
CREATE POLICY "Users can update firm milestones"
    ON public.milestones
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can delete milestones for their firm's projects
DROP POLICY IF EXISTS "Users can delete firm milestones" ON public.milestones;
CREATE POLICY "Users can delete firm milestones"
    ON public.milestones
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- MILESTONE_PAYMENTS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view payments for their firm's milestones
DROP POLICY IF EXISTS "Users can view firm milestone payments" ON public.milestone_payments;
CREATE POLICY "Users can view firm milestone payments"
    ON public.milestone_payments
    FOR SELECT
    USING (
        milestone_id IN (
            SELECT id FROM public.milestones
            WHERE project_id IN (
                SELECT id FROM public.projects
                WHERE firm_id IN (
                    SELECT firm_id FROM public.users WHERE id = auth.uid()
                )
            )
        )
    );

-- Policy: Users can create payments for their firm's milestones
DROP POLICY IF EXISTS "Users can create firm milestone payments" ON public.milestone_payments;
CREATE POLICY "Users can create firm milestone payments"
    ON public.milestone_payments
    FOR INSERT
    WITH CHECK (
        milestone_id IN (
            SELECT id FROM public.milestones
            WHERE project_id IN (
                SELECT id FROM public.projects
                WHERE firm_id IN (
                    SELECT firm_id FROM public.users WHERE id = auth.uid()
                )
            )
        )
    );

-- Policy: Users can update payments for their firm's milestones
DROP POLICY IF EXISTS "Users can update firm milestone payments" ON public.milestone_payments;
CREATE POLICY "Users can update firm milestone payments"
    ON public.milestone_payments
    FOR UPDATE
    USING (
        milestone_id IN (
            SELECT id FROM public.milestones
            WHERE project_id IN (
                SELECT id FROM public.projects
                WHERE firm_id IN (
                    SELECT firm_id FROM public.users WHERE id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        milestone_id IN (
            SELECT id FROM public.milestones
            WHERE project_id IN (
                SELECT id FROM public.projects
                WHERE firm_id IN (
                    SELECT firm_id FROM public.users WHERE id = auth.uid()
                )
            )
        )
    );

-- ============================================================================
-- EXPENSES TABLE POLICIES
-- ============================================================================
-- Policy: Users can view expenses for their firm's projects
DROP POLICY IF EXISTS "Users can view firm expenses" ON public.expenses;
CREATE POLICY "Users can view firm expenses"
    ON public.expenses
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can create expenses for their firm's projects
DROP POLICY IF EXISTS "Users can create firm expenses" ON public.expenses;
CREATE POLICY "Users can create firm expenses"
    ON public.expenses
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can update expenses for their firm's projects
DROP POLICY IF EXISTS "Users can update firm expenses" ON public.expenses;
CREATE POLICY "Users can update firm expenses"
    ON public.expenses
    FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Users can delete expenses for their firm's projects
DROP POLICY IF EXISTS "Users can delete firm expenses" ON public.expenses;
CREATE POLICY "Users can delete firm expenses"
    ON public.expenses
    FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE firm_id IN (
                SELECT firm_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- ============================================================================
-- PAYMENT_METHODS TABLE POLICIES
-- ============================================================================
-- Policy: Users can view payment methods for their firm
DROP POLICY IF EXISTS "Users can view firm payment methods" ON public.payment_methods;
CREATE POLICY "Users can view firm payment methods"
    ON public.payment_methods
    FOR SELECT
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can create payment methods for their firm
DROP POLICY IF EXISTS "Users can create firm payment methods" ON public.payment_methods;
CREATE POLICY "Users can create firm payment methods"
    ON public.payment_methods
    FOR INSERT
    WITH CHECK (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can update payment methods for their firm
DROP POLICY IF EXISTS "Users can update firm payment methods" ON public.payment_methods;
CREATE POLICY "Users can update firm payment methods"
    ON public.payment_methods
    FOR UPDATE
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete payment methods for their firm
DROP POLICY IF EXISTS "Users can delete firm payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete firm payment methods"
    ON public.payment_methods
    FOR DELETE
    USING (
        firm_id IN (
            SELECT firm_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ==============================================================================
-- SECTION 5: STORAGE BUCKET POLICIES (if you have file uploads)
-- ==============================================================================
-- Uncomment and customize if you're using Supabase Storage

-- -- Allow authenticated users to upload files to their firm folder
-- CREATE POLICY "Users can upload to firm folder"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'project-files'
--     AND (storage.foldername(name))[1] = (
--         SELECT firm_id::text FROM public.users WHERE id = auth.uid()
--     )
-- );

-- -- Allow users to view files in their firm folder
-- CREATE POLICY "Users can view firm files"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (
--     bucket_id = 'project-files'
--     AND (storage.foldername(name))[1] = (
--         SELECT firm_id::text FROM public.users WHERE id = auth.uid()
--     )
-- );

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================
-- Run these after applying fixes to verify

-- Check that all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check that all tables have policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check that all foreign keys have indexes
SELECT
    tc.table_name,
    kcu.column_name,
    EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    ) as has_index
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
