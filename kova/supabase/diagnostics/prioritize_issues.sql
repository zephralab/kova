-- ==============================================================================
-- SUPABASE ISSUES PRIORITIZATION
-- This script categorizes issues by severity and priority
-- ==============================================================================

-- ==============================================================================
-- CRITICAL ISSUES (Fix First!)
-- ==============================================================================

-- 1. TABLES WITHOUT RLS (Critical Security Issue!)
DO $$
DECLARE
    issue_count INT;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT IN ('spatial_ref_sys');

    RAISE NOTICE '🔴 CRITICAL: % tables without RLS enabled', issue_count;
END $$;

SELECT
    'CRITICAL: RLS Disabled' as severity,
    tablename as table_name,
    'Run: ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' as quick_fix
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT IN ('spatial_ref_sys');

-- 2. TABLES WITH RLS BUT NO POLICIES (Critical Security Issue!)
DO $$
DECLARE
    issue_count INT;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename = t.tablename
        AND p.schemaname = t.schemaname
    );

    RAISE NOTICE '🔴 CRITICAL: % tables with RLS but no policies', issue_count;
END $$;

SELECT
    'CRITICAL: No RLS Policies' as severity,
    tablename as table_name,
    'Table has RLS enabled but NO policies - data is completely inaccessible!' as issue
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = t.tablename
    AND p.schemaname = t.schemaname
);

-- ==============================================================================
-- HIGH PRIORITY ISSUES
-- ==============================================================================

-- 3. MISSING INDEXES ON FOREIGN KEYS (Performance Issue)
DO $$
DECLARE
    issue_count INT;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );

    RAISE NOTICE '🟠 HIGH: % foreign keys without indexes', issue_count;
END $$;

SELECT
    'HIGH: Missing FK Index' as severity,
    tc.table_name,
    kcu.column_name,
    'Run: CREATE INDEX idx_' || tc.table_name || '_' || kcu.column_name ||
    ' ON ' || tc.table_name || '(' || kcu.column_name || ');' as quick_fix
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = tc.table_name
    AND indexdef LIKE '%' || kcu.column_name || '%'
)
LIMIT 20;

-- ==============================================================================
-- MEDIUM PRIORITY ISSUES
-- ==============================================================================

-- 4. MISSING UPDATED_AT TRIGGERS
DO $$
DECLARE
    issue_count INT;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.column_name = 'updated_at'
    AND NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        WHERE t.tgrelid = (c.table_schema || '.' || c.table_name)::regclass
        AND t.tgname LIKE '%updated_at%'
    );

    RAISE NOTICE '🟡 MEDIUM: % tables missing updated_at triggers', issue_count;
END $$;

SELECT
    'MEDIUM: Missing Trigger' as severity,
    table_name,
    'updated_at column exists but no trigger to auto-update it' as issue
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'updated_at'
AND NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = (table_schema || '.' || table_name)::regclass
    AND t.tgname LIKE '%updated_at%'
);

-- 5. NULLABLE COLUMNS THAT SHOULD BE NOT NULL
SELECT
    'MEDIUM: Nullable PK/FK' as severity,
    table_name,
    column_name,
    'Consider: ALTER TABLE ' || table_name || ' ALTER COLUMN ' || column_name || ' SET NOT NULL;' as suggestion
FROM information_schema.columns
WHERE table_schema = 'public'
AND is_nullable = 'YES'
AND column_name IN ('id', 'created_at')
LIMIT 10;

-- ==============================================================================
-- LOW PRIORITY ISSUES
-- ==============================================================================

-- 6. UNUSED INDEXES (Optimization)
DO $$
DECLARE
    issue_count INT;
BEGIN
    SELECT COUNT(*) INTO issue_count
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND idx_scan = 0;

    RAISE NOTICE '🟢 LOW: % unused indexes (can be dropped)', issue_count;
END $$;

SELECT
    'LOW: Unused Index' as severity,
    indexname as index_name,
    tablename as table_name,
    idx_scan as times_used,
    'Consider: DROP INDEX IF EXISTS ' || indexname || ';' as suggestion
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
LIMIT 10;

-- ==============================================================================
-- SUMMARY BY SEVERITY
-- ==============================================================================

DO $$
DECLARE
    critical_count INT := 0;
    high_count INT := 0;
    medium_count INT := 0;
    low_count INT := 0;
BEGIN
    -- Count critical (RLS issues)
    SELECT COUNT(*) INTO critical_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND (
        rowsecurity = false
        OR (
            rowsecurity = true
            AND NOT EXISTS (
                SELECT 1 FROM pg_policies p
                WHERE p.tablename = pg_tables.tablename
            )
        )
    )
    AND tablename NOT IN ('spatial_ref_sys');

    -- Count high (missing FK indexes)
    SELECT COUNT(*) INTO high_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = tc.table_name
        AND indexdef LIKE '%' || kcu.column_name || '%'
    );

    -- Count medium (missing triggers)
    SELECT COUNT(*) INTO medium_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'updated_at'
    AND NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        WHERE t.tgrelid = (table_schema || '.' || table_name)::regclass
        AND t.tgname LIKE '%updated_at%'
    );

    -- Count low (unused indexes)
    SELECT COUNT(*) INTO low_count
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND idx_scan = 0;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '           ISSUES SUMMARY';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '🔴 CRITICAL (Security):  %', critical_count;
    RAISE NOTICE '🟠 HIGH (Performance):   %', high_count;
    RAISE NOTICE '🟡 MEDIUM (Maintenance): %', medium_count;
    RAISE NOTICE '🟢 LOW (Optimization):   %', low_count;
    RAISE NOTICE '───────────────────────────────────────────';
    RAISE NOTICE 'TOTAL ISSUES:            %', critical_count + high_count + medium_count + low_count;
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Fix CRITICAL issues first (security!)';
    RAISE NOTICE '2. Fix HIGH issues (performance)';
    RAISE NOTICE '3. Fix MEDIUM issues when convenient';
    RAISE NOTICE '4. Fix LOW issues during optimization';
    RAISE NOTICE '';
END $$;
