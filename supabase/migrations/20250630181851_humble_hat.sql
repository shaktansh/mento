/*
  # Add teams functionality

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `room_code` (text, unique)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `user_id` (uuid, foreign key to users)
      - `role` (text, 'owner' or 'member')
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for team access control
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  room_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table
CREATE POLICY "Users can read teams they are members of"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create policies for team_members table
CREATE POLICY "Users can read team members of teams they belong to"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team owners can manage members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create trigger for updated_at on teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM teams WHERE room_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;