-- Add is_featured column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create index for faster featured post queries
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured, published_at DESC);

-- Ensure only one featured post at a time (using trigger)
CREATE OR REPLACE FUNCTION ensure_single_featured_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = TRUE THEN
    UPDATE posts SET is_featured = FALSE WHERE id != NEW.id AND is_featured = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_single_featured_post ON posts;
CREATE TRIGGER trigger_single_featured_post
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_featured_post();
