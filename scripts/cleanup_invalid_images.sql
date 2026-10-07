-- Run this on local or remote D1 to clean up any accidentally saved base64 strings
-- Command to run on production:
-- npx wrangler d1 execute vpchuoiskechers-db --file=scripts/cleanup_invalid_images.sql --remote

UPDATE meeting_rooms
SET images = '[]'
WHERE images LIKE '%"data:image%';
