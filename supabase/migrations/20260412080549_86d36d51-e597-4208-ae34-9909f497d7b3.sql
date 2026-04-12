
-- Seed initial owners
INSERT INTO public.admin_team (user_id, admin_role, assigned_by)
VALUES
  ('8b78444a-f6d6-498e-baa1-b63012050a74', 'owner', '8b78444a-f6d6-498e-baa1-b63012050a74'),
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'owner', '8b78444a-f6d6-498e-baa1-b63012050a74')
ON CONFLICT (user_id) DO UPDATE SET admin_role = 'owner';
