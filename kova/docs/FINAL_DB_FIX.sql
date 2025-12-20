-- ROBUST FIX FOR INFINITE RECURSION
-- This script replaces recursive subqueries with a SECURITY DEFINER function.
-- This is the industry-standard way to solve RLS infinite loops in Supabase.

-- 1. Create a secure function to get your own firm_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_firm_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- Runs as admin, bypassing RLS
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM users WHERE id = auth.uid();
$$;

-- 2. Drop the problematic policies
DROP POLICY IF EXISTS "Users can view firm members" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- Also drop the original recursive one if it still exists
DROP POLICY IF EXISTS "Firm members can view firm members" ON users; 

-- 3. Create new, clean policies

-- Policy A: See your own profile (Base access)
CREATE POLICY "Users can view own profile" ON users 
FOR SELECT USING (auth.uid() = id);

-- Policy B: See colleagues (Uses the secure function, so NO RECURSION)
CREATE POLICY "Users can view firm members" ON users 
FOR SELECT USING (
    firm_id = get_my_firm_id()
);

-- 4. Ensure the backend rescue function exists
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_my_firm_id TO authenticated;
GRANT EXECUTE ON FUNCTION force_get_firm_id TO authenticated;
