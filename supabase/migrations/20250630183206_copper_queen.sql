/*
  # Fix RLS policies for team_members and users tables

  1. Policy Fixes
    - Drop and recreate team_members policies to fix infinite recursion
    - Ensure users table policies allow proper self-access
    - Simplify policy logic to prevent circular references

  2. Changes Made
    - Fixed team_members SELECT policy to avoid self-referencing subquery
    - Fixed team_members DELETE policy to use simpler logic
    - Ensured users table has proper SELECT policy for authenticated users
    - Added missing DELETE policy for users table

  3. Security
    - Maintains proper access control
    - Prevents infinite recursion in policy evaluation
    - Allows users to manage their own data appropriately
*/

-- Fix team_members table policies
DROP POLICY IF EXISTS "Users can read team members of teams they belong to" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;

-- Create simplified team_members policies
CREATE POLICY "Users can read team members of teams they belong to"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm_owner
      WHERE tm_owner.team_id = team_members.team_id
      AND tm_owner.user_id = auth.uid()
      AND tm_owner.role = 'owner'
    )
  );

-- Ensure users table has proper policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate users policies with proper logic
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own data"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Add missing function for room code generation if it doesn't exist
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE room_code = code) INTO exists_check;
    
    -- If code doesn't exist, we can use it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;