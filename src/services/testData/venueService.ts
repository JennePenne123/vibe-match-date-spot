import { supabase } from '@/integrations/supabase/client';

export const createTestVenues = async () => {
  try {
    console.log('Creating test venues...');
    
    const venues = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Romantic Rooftop',
        address: '123 Downtown Ave',
        cuisine_type: 'Italian',
        price_range: '$$',
        rating: 4.5,
        tags: ['romantic', 'rooftop', 'intimate'],
        description: 'Beautiful rooftop dining with city views',
        is_active: true
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Cozy Coffee Corner',
        address: '456 Main St',
        cuisine_type: 'Cafe',
        price_range: '$',
        rating: 4.2,
        tags: ['casual', 'cozy', 'coffee'],
        description: 'Perfect spot for casual dates and conversations',
        is_active: true
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Upscale Steakhouse',
        address: '789 Elite Blvd',
        cuisine_type: 'American',
        price_range: '$$$',
        rating: 4.8,
        tags: ['upscale', 'formal', 'steakhouse'],
        description: 'Premium dining experience for special occasions',
        is_active: true
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        name: 'Trendy Sushi Bar',
        address: '321 Hip St',
        cuisine_type: 'Japanese',
        price_range: '$$',
        rating: 4.3,
        tags: ['trendy', 'modern', 'sushi'],
        description: 'Modern sushi bar with creative rolls',
        is_active: true
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        name: 'Family Pizza Place',
        address: '654 Family Ave',
        cuisine_type: 'Italian',
        price_range: '$',
        rating: 4.0,
        tags: ['casual', 'family', 'pizza'],
        description: 'Great for relaxed, fun dates',
        is_active: true
      }
    ];

    const { error } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'id' });

    if (error) {
      console.error('Error creating test venues:', error);
      throw error;
    }

    console.log('Test venues created successfully');
    return true;
  } catch (error) {
    console.error('Error in createTestVenues:', error);
    throw error;
  }
};