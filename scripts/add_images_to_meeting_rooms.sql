-- Auto-generated migration script to add images column to meeting_rooms
-- Run with: npx wrangler d1 execute vpchuoiskechers-db --file=scripts/add_images_to_meeting_rooms.sql

-- First check if we need to add the column, since SQLite does not support ADD COLUMN IF NOT EXISTS.
-- It's safe to run if it fails when the column already exists.
ALTER TABLE meeting_rooms ADD COLUMN images TEXT DEFAULT '[]';

-- Update existing rooms to ensure valid JSON array instead of NULL
UPDATE meeting_rooms SET images = '[]' WHERE images IS NULL;
