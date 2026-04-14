-- Delete non-restaurant venues (supermarkets, grocery stores, convenience stores)
DELETE FROM venues WHERE id IN (
  '607f21b02c715c05d6611c22',
  '64a84261facc893770da6110',
  '607f21a34669ec27bf79c30d',
  '607f2198a359cb7ad9361088',
  '627ac6d8f7cf7874e14c9f09',
  '64c986495bd8ad660f178835',
  '607f21a44669ec27bf7c9fc9'
);