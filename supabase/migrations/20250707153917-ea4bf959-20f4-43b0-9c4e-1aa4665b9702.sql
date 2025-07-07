-- Create bidirectional friendships with correct user IDs
-- User 1 (janwiechmann@hotmail.com): c733288b-7d22-427c-b6d3-43cfe2d0dcf7
-- User 2 (jennepenne123@gmail.com): dbfe64ff-d75a-4032-af21-6c31bfdc4215  
-- User 3 (info@janwiechmann.de): b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa

-- Friendship between User 1 and User 2 (bidirectional)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('c733288b-7d22-427c-b6d3-43cfe2d0dcf7', 'dbfe64ff-d75a-4032-af21-6c31bfdc4215', 'accepted'),
  ('dbfe64ff-d75a-4032-af21-6c31bfdc4215', 'c733288b-7d22-427c-b6d3-43cfe2d0dcf7', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- Friendship between User 1 and User 3 (bidirectional)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('c733288b-7d22-427c-b6d3-43cfe2d0dcf7', 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'accepted'),
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'c733288b-7d22-427c-b6d3-43cfe2d0dcf7', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- Friendship between User 2 and User 3 (bidirectional)
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES 
  ('dbfe64ff-d75a-4032-af21-6c31bfdc4215', 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'accepted'),
  ('b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa', 'dbfe64ff-d75a-4032-af21-6c31bfdc4215', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;