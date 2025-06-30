/*
  # Fix team joining functionality

  1. Improvements
    - Add better indexes for performance
    - Ensure room code validation works properly
    - Add function to check if team exists by room code
    - Improve error handling for team operations

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_teams_room_code ON teams(room_code);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- Ensure the room code generation function works properly
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
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code using only uppercase letters and numbers
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Replace any lowercase letters with numbers to ensure uppercase
    code := translate(code, 'abcdefghijklmnopqrstuvwxyz', '0123456789012345678901234');
    
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

-- Function to find team by room code (for better error handling)
CREATE OR REPLACE FUNCTION find_team_by_room_code(code text)
RETURNS TABLE(team_id uuid, team_name text, team_room_code text, team_created_by uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, name, room_code, created_by
  FROM teams 
  WHERE room_code = upper(trim(code))
  LIMIT 1;
$$;

-- Function to check if user is already a team member
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

-- Ensure all RLS policies are working correctly
-- (Policies were already fixed in previous migrations, just ensuring they exist)

-- Verify teams table policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teams' AND policyname = 'Users can create teams'
  ) THEN
    CREATE POLICY "Users can create teams"
      ON teams
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- Verify team_members table policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'team_members' AND policyname = 'Users can join teams'
  ) THEN
    CREATE POLICY "Users can join teams"
      ON team_members
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;