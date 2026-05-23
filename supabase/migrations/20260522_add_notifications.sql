-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  trigger_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id, trigger_user_id, type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Remove duplicate notification rows if the table already existed without the unique index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
  ) THEN
    DELETE FROM notifications n
    USING (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id, post_id, trigger_user_id, type
               ORDER BY created_at ASC, id ASC
             ) AS rn
      FROM notifications
    ) duplicates
    WHERE n.id = duplicates.id
      AND duplicates.rn > 1;
  END IF;
END $$;

-- Ensure the ON CONFLICT target has a matching unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_key
  ON notifications (user_id, post_id, trigger_user_id, type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_view_own'
  ) THEN
    CREATE POLICY notifications_view_own ON notifications
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policy: System can insert notifications (for triggers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_insert_system'
  ) THEN
    CREATE POLICY notifications_insert_system ON notifications
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- RLS Policy: Users can update their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_update_own'
  ) THEN
    CREATE POLICY notifications_update_own ON notifications
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Trigger function to create notification when post is liked
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, post_id, trigger_user_id)
  SELECT 
    p.author_id,
    'like',
    p.id,
    NEW.user_id
  FROM posts p
  WHERE p.id = NEW.post_id
  AND p.author_id != NEW.user_id
  ON CONFLICT (user_id, post_id, trigger_user_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to create notification when comment is created
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, post_id, trigger_user_id)
  SELECT 
    p.author_id,
    'comment',
    p.id,
    NEW.author_id
  FROM posts p
  WHERE p.id = NEW.post_id
  AND p.author_id != NEW.author_id
  ON CONFLICT (user_id, post_id, trigger_user_id, type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach triggers to likes table
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_like_notification();

-- Attach triggers to comments table
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();
