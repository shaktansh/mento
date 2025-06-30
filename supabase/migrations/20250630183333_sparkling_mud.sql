/*
  # Fix infinite recursion in team_members RLS policies

  1. Problem
    - The current RLS policies on team_members table cause infinite recursion
    - The SELECT policy tries to query team_members within itself
    - This creates a loop when checking permissions

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid recursion
    - Use direct user_id checks where possible
    - Use team ownership checks through teams table instead of team_members

  3. New Policies
    - Users can read their own team membership records
    - Users can insert their own team membership records  
    - Team owners can manage all members (using teams table to avoid recursion)
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read team members of teams they belong to" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;

-- Create new policies that avoid recursion

-- Users can always read their own team membership records
CREATE POLICY "Users can read own team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can read team members if they are the team owner (check via teams table)
CREATE POLICY "Team owners can read all team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- Users can insert their own team membership records
CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Team owners can delete team members (check ownership via teams table)
CREATE POLICY "Team owners can remove members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- Users can leave teams (delete their own membership)
CREATE POLICY "Users can leave teams"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());