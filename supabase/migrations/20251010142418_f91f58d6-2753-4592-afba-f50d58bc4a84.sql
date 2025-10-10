-- Update avatars for registered users with diverse, high-quality portraits

-- Update Jan Wiechmann (Male user)
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    updated_at = now()
WHERE id = 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa';

-- Update Jenne Penne (Female user)
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    updated_at = now()
WHERE id = 'dbfe64ff-d75a-4032-af21-6c31bfdc4215';

-- Update Jan W. (Male user - different portrait)
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    updated_at = now()
WHERE id = 'c733288b-7d22-427c-b6d3-43cfe2d0dcf7';