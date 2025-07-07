
-- Create bidirectional friendships between the users
-- User 1 (janwiechmann@hotmail.com) ID: b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa
-- User 2 (jennepenne123@gmail.com) ID: e3a5169e-d796-4f07-9242-e7b8811d55aa  
-- User 3 (info@janwiechmann.de) ID: a8328dfd-9d7d-4e50-8c09-dfb646436b48

-- Friendship between User 1 and User 2 (bidirectional)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'e3a5169e-d796-4f07-9242-e7b8811d55aa', 'accepted'),
  ('e3a5169e-d796-4f07-9242-e7b8811d55aa', 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- Friendship between User 1 and User 3 (bidirectional)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'a8328dfd-9d7d-4e50-8c09-dfb646436b48', 'accepted'),
  ('a8328dfd-9d7d-4e50-8c09-dfb646436b48', 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;
