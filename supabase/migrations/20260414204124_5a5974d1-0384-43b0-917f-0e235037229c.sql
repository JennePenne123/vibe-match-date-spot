-- Delete all Museum, Theater, and Cinema venues (non-gastronomy)
DELETE FROM venues WHERE cuisine_type IN ('Museum', 'Theater', 'Cinema');