-- Freundschaft: Lenny <-> Jan Wiechmann (bidirektional, status accepted)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('8b78444a-f6d6-498e-baa1-b63012050a74', 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'accepted'),
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', '8b78444a-f6d6-498e-baa1-b63012050a74', 'accepted')
ON CONFLICT DO NOTHING;