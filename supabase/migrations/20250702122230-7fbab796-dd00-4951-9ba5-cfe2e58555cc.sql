-- Add friendship between current user and the manually added user
INSERT INTO public.friendships (user_id, friend_id, status)
VALUES ('e3a5169e-d796-4f07-9242-e7b8811d55aa', 'a8328dfd-9d7d-4e50-8c09-dfb646436b48', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;