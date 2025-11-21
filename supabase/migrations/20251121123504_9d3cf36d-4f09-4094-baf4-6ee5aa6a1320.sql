-- Enable real-time updates for vouchers table
ALTER TABLE vouchers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;

-- Enable real-time updates for voucher_redemptions table
ALTER TABLE voucher_redemptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE voucher_redemptions;