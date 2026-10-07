ALTER TABLE business_trips ADD COLUMN destinations_json TEXT;
ALTER TABLE business_trips ADD COLUMN logistics_json TEXT;
ALTER TABLE business_trips ADD COLUMN logistics_status TEXT DEFAULT 'NOT_STARTED';

-- Update existing records to convert single destination to a single-item destinations_json array
UPDATE business_trips 
SET destinations_json = json_array(
  json_object(
    'id', 'dest_' || hex(randomblob(4)),
    'region', COALESCE(region, ''),
    'factory', COALESCE(factory, ''),
    'location', COALESCE(location, ''),
    'startDate', COALESCE(start_date, ''),
    'endDate', COALESCE(end_date, ''),
    'daysCount', COALESCE(days_count, 1),
    'accommodationType', 'NONE',
    'checkInDate', '',
    'checkOutDate', '',
    'accommodationNote', ''
  )
)
WHERE destinations_json IS NULL;
