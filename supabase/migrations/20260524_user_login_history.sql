-- Create user_login_history table to track login events
CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'sign_up', 'password_reset')),
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id 
  ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_created_at 
  ON user_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_history_event_type 
  ON user_login_history(event_type);

-- Enable RLS
ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admin and the user themselves can view login history
CREATE POLICY "Users can view own login history" 
  ON user_login_history 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Only admin can insert (via trigger) or delete
CREATE POLICY "Admin can manage login history" 
  ON user_login_history 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to log auth events (via hook or webhook)
CREATE OR REPLACE FUNCTION log_user_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_login_history (
    user_id, 
    event_type, 
    user_agent, 
    ip_address, 
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_user_agent,
    p_ip_address,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_user_event TO authenticated;
