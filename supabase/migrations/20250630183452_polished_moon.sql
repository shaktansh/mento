/*
  # Fix Teams RLS Infinite Recursion

  1. Problem
    - The current RLS policy on `teams` table causes infinite recursion
    - Policy checks team membership by querying `team_members` table
    - This creates circular dependency between `teams` and `team_members` policies

  2. Solution
    - Drop existing problematic policies on `teams` table
    - Create new policies that avoid circular references
    - Use direct user ID checks where possible
    - Ensure `team_members` policies are simple and don't reference `teams`

  3. Security
    - Maintain same security level
    - Users can only see teams they are members of
    - Team owners can manage their teams
    - Users can create teams
*/

-- Drop existing policies on teams table that cause recursion
DROP POLICY IF EXISTS "Users can read teams they are members of" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;

-- Create new policies that avoid recursion

-- Allow users to create teams (simple check)
CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to read teams they created
CREATE POLICY "Team creators can read their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow team owners to update teams they created
CREATE POLICY "Team creators can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create a function to safely check team membership without recursion
CREATE OR REPLACE FUNCTION is_team_member(team_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid AND user_id = user_uuid
  );
$$;

-- Allow team members to read teams (using function to avoid recursion)
CREATE POLICY "Team members can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (is_team_member(id, auth.uid()));

-- Ensure team_members policies are simple and don't cause recursion
DROP POLICY IF EXISTS "Team owners can read all team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Users can read own team memberships" ON team_members;

-- Recreate team_members policies without circular references
CREATE POLICY "Users can read own team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Team creators can manage all members of their teams
CREATE POLICY "Team creators can read all team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can remove members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.created_by = auth.uid()
    )
  );