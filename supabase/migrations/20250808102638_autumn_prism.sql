/*
  # User reminders and email data schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - references auth.users
      - `email` (text, unique)
      - `google_refresh_token` (text, encrypted)
      - `created_at` (timestamp)
    - `email_reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `email_id` (text) - Gmail message ID
      - `email_subject` (text)
      - `email_sender` (text)
      - `email_snippet` (text)
      - `summary` (text) - AI-generated summary
      - `action_items` (jsonb) - Array of action items
      - `remind_at` (timestamp)
      - `priority_level` (integer) - 1-5 scale
      - `is_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  google_refresh_token text,
  created_at timestamptz DEFAULT now()
);

-- Email reminders table
CREATE TABLE IF NOT EXISTS email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  email_subject text NOT NULL,
  email_sender text NOT NULL,
  email_snippet text,
  summary text,
  action_items jsonb DEFAULT '[]'::jsonb,
  remind_at timestamptz NOT NULL,
  priority_level integer DEFAULT 3 CHECK (priority_level >= 1 AND priority_level <= 5),
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reminders ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Email reminders policies
CREATE POLICY "Users can view own reminders"
  ON email_reminders
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own reminders"
  ON email_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own reminders"
  ON email_reminders
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own reminders"
  ON email_reminders
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_reminders_user_id ON email_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_remind_at ON email_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_email_reminders_priority ON email_reminders(priority_level DESC);
CREATE INDEX IF NOT EXISTS idx_email_reminders_completed ON email_reminders(is_completed);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_reminders_updated_at
  BEFORE UPDATE ON email_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();