-- Update avatars to use proper headshots

-- Jan Wiechmann (male) - use the professional man in checkered shirt
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 
    updated_at = now() 
WHERE id = 'b93bf7ae-c1c8-4f7e-9cb7-4ec0571f6dfa';

-- Jenne Penne (female) - use the woman with laptop
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 
    updated_at = now() 
WHERE id = 'dbfe64ff-d75a-4032-af21-6c31bfdc4215';

-- Jan W. (male) - use the person with blue light bulb (professional headshot style)
UPDATE profiles 
SET avatar_url = 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 
    updated_at = now() 
WHERE id = 'c733288b-7d22-427c-b6d3-43cfe2d0dcf7';