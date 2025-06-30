/*
  # Create user data tables for Mento AI

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `mode` (text, 'solo' or 'team')
      - `daily_reminder_time` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `mood` (integer, 1-10)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `energy_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `energy` (integer, 1-10)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `check_ins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `mood` (integer, 1-10)
      - `energy` (integer, 1-10)
      - `notes` (text, optional)
      - `tags` (text array)
      - `created_at` (timestamp)
    
    - `journal_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `content` (text)
      - `mood` (integer, 1-10)
      - `tags` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  mode text DEFAULT 'solo' CHECK (mode IN ('solo', 'team')),
  daily_reminder_time text DEFAULT '09:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 10),
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create energy_entries table
CREATE TABLE IF NOT EXISTS energy_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  energy integer NOT NULL CHECK (energy >= 1 AND energy <= 10),
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 10),
  energy integer NOT NULL CHECK (energy >= 1 AND energy <= 10),
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 10),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
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
  USING (auth.uid() = id);

-- Create policies for mood_entries table
CREATE POLICY "Users can read own mood entries"
  ON mood_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for energy_entries table
CREATE POLICY "Users can read own energy entries"
  ON energy_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy entries"
  ON energy_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy entries"
  ON energy_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own energy entries"
  ON energy_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for check_ins table
CREATE POLICY "Users can read own check ins"
  ON check_ins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check ins"
  ON check_ins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check ins"
  ON check_ins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check ins"
  ON check_ins
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for journal_entries table
CREATE POLICY "Users can read own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();