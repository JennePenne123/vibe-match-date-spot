-- Add venue_partner role for project owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('8b78444a-f6d6-498e-baa1-b63012050a74', 'venue_partner')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add admin role for project owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('8b78444a-f6d6-498e-baa1-b63012050a74', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;