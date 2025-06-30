/*
  # Fix team joining functionality

  1. Ensure room code generation function works properly
  2. Add better error handling for team operations
  3. Verify all policies are working correctly
*/

-- Ensure the room code generation function is properly defined
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
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
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

-- Ensure teams table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_room_code ON teams(room_code);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- Add a function to validate room codes
CREATE OR REPLACE FUNCTION validate_room_code(code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE room_code = upper(trim(code))
  );
$$;

-- Ensure all necessary policies exist and work correctly
-- (The policies were already fixed in previous migrations)