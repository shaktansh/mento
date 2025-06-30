/*
  # Fix team joining functionality

  1. Improve room code generation to ensure better uniqueness
  2. Add better helper functions for team operations
  3. Ensure all policies work correctly for team joining
  4. Add debugging functions to help troubleshoot issues
*/

-- Improved room code generation function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
  exists_check boolean;
  attempts integer := 0;
  max_attempts integer := 100;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i integer;
BEGIN
  LOOP
    code := '';
    
    -- Generate 6 random characters from the allowed set
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE room_code = code) INTO exists_check;
    
    -- Increment attempts counter
    attempts := attempts + 1;
    
    -- If code doesn't exist, we can use it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
    
    -- Prevent infinite loops
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique room code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Improved function to find team by room code
CREATE OR REPLACE FUNCTION find_team_by_room_code(code text)
RETURNS TABLE(team_id uuid, team_name text, team_room_code text, team_created_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  clean_code text;
BEGIN
  -- Clean and normalize the input code
  clean_code := upper(trim(code));
  
  -- Validate code format
  IF clean_code IS NULL OR length(clean_code) != 6 THEN
    RETURN;
  END IF;
  
  -- Return team data if found
  RETURN QUERY
  SELECT t.id, t.name, t.room_code, t.created_by
  FROM teams t
  WHERE t.room_code = clean_code
  LIMIT 1;
END;
$$;

-- Improved function to check team membership
CREATE OR REPLACE FUNCTION is_user_team_member(team_uuid uuid, user_uuid uuid)
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

-- Function to get team member count
CREATE OR REPLACE FUNCTION get_team_member_count(team_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM team_members 
  WHERE team_id = team_uuid;
$$;

-- Function to debug team access (for troubleshooting)
CREATE OR REPLACE FUNCTION debug_team_access(team_uuid uuid, user_uuid uuid)
RETURNS TABLE(
  team_exists boolean,
  user_is_member boolean,
  team_name text,
  room_code text,
  member_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM teams WHERE id = team_uuid) as team_exists,
    EXISTS(SELECT 1 FROM team_members WHERE team_id = team_uuid AND user_id = user_uuid) as user_is_member,
    (SELECT name FROM teams WHERE id = team_uuid) as team_name,
    (SELECT teams.room_code FROM teams WHERE id = team_uuid) as room_code,
    (SELECT COUNT(*)::integer FROM team_members WHERE team_id = team_uuid) as member_count;
END;
$$;

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_teams_room_code_upper ON teams(upper(room_code));
CREATE INDEX IF NOT EXISTS idx_team_members_composite ON team_members(team_id, user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_room_code() TO authenticated;
GRANT EXECUTE ON FUNCTION find_team_by_room_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_member_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_team_access(uuid, uuid) TO authenticated;

-- Ensure RLS policies are correctly set up
-- Drop and recreate policies to ensure they're correct

-- Teams table policies
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team creators can read their teams" ON teams;
DROP POLICY IF EXISTS "Team members can read teams" ON teams;
DROP POLICY IF EXISTS "Team creators can update their teams" ON teams;

CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can read their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Team members can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (is_team_member(id, auth.uid()));

CREATE POLICY "Team creators can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Team members table policies
DROP POLICY IF EXISTS "Users can read own team memberships" ON team_members;
DROP POLICY IF EXISTS "Team creators can read all team members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Team creators can remove members" ON team_members;

CREATE POLICY "Users can read own team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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