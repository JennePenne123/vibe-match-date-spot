import { supabase } from '@/integrations/supabase/client';

export const createEnhancedTestVenues = async () => {
  try {
    console.log('Creating enhanced test venue dataset (25+ venues)...');
    
    // Hamburg coordinates for location-based testing
    const hamburgLat = 53.5511;
    const hamburgLng = 9.9937;
    
    const venues = [
      // ROMANTIC ITALIAN RESTAURANTS ($$ - $$$)
      {
        id: 'romantic-italian-01',
        name: 'La Bella Notte',
        address: 'Jungfernstieg 12, 20354 Hamburg',
        cuisine_type: 'Italian',
        price_range: '$$$',
        rating: 4.7,
        tags: ['romantic', 'intimate', 'candlelit', 'wine'],
        description: 'Intimate Italian dining with candlelit atmosphere',
        latitude: hamburgLat + 0.001,
        longitude: hamburgLng + 0.001,
        is_active: true
      },
      {
        id: 'romantic-italian-02',
        name: 'Amore Ristorante',
        address: 'Mönckebergstraße 7, 20095 Hamburg',
        cuisine_type: 'Italian',
        price_range: '$$',
        rating: 4.5,
        tags: ['romantic', 'cozy', 'pasta', 'wine'],
        description: 'Cozy trattoria perfect for intimate dates',
        latitude: hamburgLat + 0.002,
        longitude: hamburgLng + 0.002,
        is_active: true
      },
      {
        id: 'romantic-italian-03',
        name: 'Castello Romano',
        address: 'Reeperbahn 88, 20359 Hamburg',
        cuisine_type: 'Italian',
        price_range: '$$$',
        rating: 4.8,
        tags: ['romantic', 'upscale', 'wine', 'intimate'],
        description: 'Upscale Italian with romantic ambiance',
        latitude: hamburgLat - 0.001,
        longitude: hamburgLng - 0.001,
        is_active: true
      },

      // CASUAL AMERICAN PLACES ($ - $$)
      {
        id: 'casual-american-01',
        name: 'Burger Paradise',
        address: 'Schulterblatt 15, 20357 Hamburg',
        cuisine_type: 'American',
        price_range: '$',
        rating: 4.2,
        tags: ['casual', 'burgers', 'relaxed', 'friendly'],
        description: 'Best burgers in town, casual atmosphere',
        latitude: hamburgLat + 0.003,
        longitude: hamburgLng - 0.002,
        is_active: true
      },
      {
        id: 'casual-american-02',
        name: 'The Diner',
        address: 'Lange Reihe 22, 20099 Hamburg',
        cuisine_type: 'American',
        price_range: '$$',
        rating: 4.1,
        tags: ['casual', 'diner', 'comfort-food', 'lively'],
        description: 'Classic American diner experience',
        latitude: hamburgLat - 0.002,
        longitude: hamburgLng + 0.003,
        is_active: true
      },

      // TRENDY ASIAN RESTAURANTS ($$ - $$$)
      {
        id: 'trendy-asian-01',
        name: 'Sakura Sushi Bar',
        address: 'Eppendorfer Weg 35, 20259 Hamburg',
        cuisine_type: 'Japanese',
        price_range: '$$',
        rating: 4.6,
        tags: ['trendy', 'modern', 'sushi', 'hip'],
        description: 'Modern sushi bar with creative rolls',
        latitude: hamburgLat + 0.004,
        longitude: hamburgLng - 0.001,
        is_active: true
      },
      {
        id: 'trendy-asian-02',
        name: 'Dragon Palace',
        address: 'Grindelhof 88, 20146 Hamburg',
        cuisine_type: 'Chinese',
        price_range: '$$$',
        rating: 4.4,
        tags: ['trendy', 'upscale', 'modern', 'stylish'],
        description: 'Upscale Chinese with modern twist',
        latitude: hamburgLat - 0.003,
        longitude: hamburgLng + 0.002,
        is_active: true
      },
      {
        id: 'trendy-asian-03',
        name: 'Noodle Street',
        address: 'Sternschanze 44, 20357 Hamburg',
        cuisine_type: 'Vietnamese',
        price_range: '$',
        rating: 4.3,
        tags: ['casual', 'trendy', 'noodles', 'authentic'],
        description: 'Authentic Vietnamese street food',
        latitude: hamburgLat + 0.002,
        longitude: hamburgLng - 0.003,
        is_active: true
      },

      // VEGETARIAN/VEGAN OPTIONS
      {
        id: 'vegan-01',
        name: 'Green Garden Bistro',
        address: 'Karolinenstraße 12, 20357 Hamburg',
        cuisine_type: 'Vegetarian',
        price_range: '$$',
        rating: 4.5,
        tags: ['vegetarian', 'vegan', 'healthy', 'organic'],
        description: 'Fresh vegetarian cuisine with vegan options',
        latitude: hamburgLat - 0.001,
        longitude: hamburgLng - 0.002,
        is_active: true
      },
      {
        id: 'vegan-02',
        name: 'Plant Based Kitchen',
        address: 'Ottenser Hauptstraße 67, 22765 Hamburg',
        cuisine_type: 'Vegan',
        price_range: '$$',
        rating: 4.6,
        tags: ['vegan', 'healthy', 'trendy', 'sustainable'],
        description: '100% plant-based innovative cuisine',
        latitude: hamburgLat + 0.001,
        longitude: hamburgLng - 0.004,
        is_active: true
      },

      // FRENCH CUISINE ($$$)
      {
        id: 'french-01',
        name: 'Bistro Magnifique',
        address: 'Colonnaden 5, 20354 Hamburg',
        cuisine_type: 'French',
        price_range: '$$$',
        rating: 4.8,
        tags: ['romantic', 'upscale', 'wine', 'elegant'],
        description: 'Elegant French bistro with wine pairings',
        latitude: hamburgLat + 0.002,
        longitude: hamburgLng + 0.001,
        is_active: true
      },
      {
        id: 'french-02',
        name: 'Le Petit Café',
        address: 'Rothenbaumchaussee 15, 20148 Hamburg',
        cuisine_type: 'French',
        price_range: '$$',
        rating: 4.4,
        tags: ['casual', 'cozy', 'bistro', 'wine'],
        description: 'Charming French café atmosphere',
        latitude: hamburgLat - 0.001,
        longitude: hamburgLng + 0.004,
        is_active: true
      },

      // MEXICAN CUISINE ($ - $$)
      {
        id: 'mexican-01',
        name: 'Taco Libre',
        address: 'Heiligengeistfeld 7, 20359 Hamburg',
        cuisine_type: 'Mexican',
        price_range: '$',
        rating: 4.2,
        tags: ['casual', 'lively', 'tacos', 'fun'],
        description: 'Authentic Mexican tacos and margaritas',
        latitude: hamburgLat + 0.003,
        longitude: hamburgLng + 0.002,
        is_active: true
      },
      {
        id: 'mexican-02',
        name: 'Casa Mexicana',
        address: 'Barnerstraße 42, 22765 Hamburg',
        cuisine_type: 'Mexican',
        price_range: '$$',
        rating: 4.3,
        tags: ['casual', 'family', 'authentic', 'colorful'],
        description: 'Family-style Mexican restaurant',
        latitude: hamburgLat - 0.002,
        longitude: hamburgLng - 0.003,
        is_active: true
      },

      // THAI CUISINE ($$ - $$$)
      {
        id: 'thai-01',
        name: 'Bangkok Garden',
        address: 'Clemens-Schultz-Straße 88, 20359 Hamburg',
        cuisine_type: 'Thai',
        price_range: '$$',
        rating: 4.4,
        tags: ['spicy', 'authentic', 'casual', 'flavorful'],
        description: 'Authentic Thai flavors and spices',
        latitude: hamburgLat + 0.004,
        longitude: hamburgLng - 0.002,
        is_active: true
      },
      {
        id: 'thai-02',
        name: 'Royal Thai Palace',
        address: 'Dammtorstraße 29, 20354 Hamburg',
        cuisine_type: 'Thai',
        price_range: '$$$',
        rating: 4.6,
        tags: ['upscale', 'elegant', 'spicy', 'romantic'],
        description: 'Upscale Thai dining with elegant atmosphere',
        latitude: hamburgLat - 0.003,
        longitude: hamburgLng + 0.001,
        is_active: true
      },

      // SEAFOOD RESTAURANTS ($$ - $$$$)
      {
        id: 'seafood-01',
        name: 'Harbor Fresh',
        address: 'Landungsbrücken 3, 20359 Hamburg',
        cuisine_type: 'Seafood',
        price_range: '$$$',
        rating: 4.7,
        tags: ['fresh', 'harbor-view', 'upscale', 'romantic'],
        description: 'Fresh seafood with harbor views',
        latitude: hamburgLat + 0.002,
        longitude: hamburgLng - 0.001,
        is_active: true
      },
      {
        id: 'seafood-02',
        name: 'The Oyster House',
        address: 'Fischmarkt 10, 22767 Hamburg',
        cuisine_type: 'Seafood',
        price_range: '$$$$',
        rating: 4.9,
        tags: ['luxury', 'oysters', 'wine', 'romantic'],
        description: 'Premium oyster bar and seafood',
        latitude: hamburgLat - 0.002,
        longitude: hamburgLng + 0.002,
        is_active: true
      },

      // INDIAN CUISINE ($$ - $$$)
      {
        id: 'indian-01',
        name: 'Curry Palace',
        address: 'Steindamm 55, 20099 Hamburg',
        cuisine_type: 'Indian',
        price_range: '$$',
        rating: 4.5,
        tags: ['spicy', 'authentic', 'curry', 'flavorful'],
        description: 'Authentic Indian curries and tandoori',
        latitude: hamburgLat + 0.001,
        longitude: hamburgLng - 0.002,
        is_active: true
      },
      {
        id: 'indian-02',
        name: 'Maharaja Restaurant',
        address: 'Grindelallee 148, 20146 Hamburg',
        cuisine_type: 'Indian',
        price_range: '$$$',
        rating: 4.6,
        tags: ['upscale', 'traditional', 'spicy', 'elegant'],
        description: 'Upscale Indian dining experience',
        latitude: hamburgLat - 0.002,
        longitude: hamburgLng + 0.001,
        is_active: true
      },

      // STEAKHOUSES ($$$$ - $$$$)
      {
        id: 'steakhouse-01',
        name: 'Prime Cuts',
        address: 'Ballindamm 40, 20095 Hamburg',
        cuisine_type: 'Steakhouse',
        price_range: '$$$$',
        rating: 4.8,
        tags: ['luxury', 'steaks', 'wine', 'upscale'],
        description: 'Premium steaks and fine dining',
        latitude: hamburgLat + 0.001,
        longitude: hamburgLng + 0.001,
        is_active: true
      },
      {
        id: 'steakhouse-02',
        name: 'The Meat House',
        address: 'Hohe Bleichen 8, 20354 Hamburg',
        cuisine_type: 'Steakhouse',
        price_range: '$$$',
        rating: 4.6,
        tags: ['steaks', 'meat', 'hearty', 'casual-upscale'],
        description: 'Quality steaks in relaxed upscale setting',
        latitude: hamburgLat - 0.001,
        longitude: hamburgLng + 0.002,
        is_active: true
      },

      // FUSION RESTAURANTS ($$ - $$$)
      {
        id: 'fusion-01',
        name: 'East Meets West',
        address: 'Große Freiheit 36, 22767 Hamburg',
        cuisine_type: 'Fusion',
        price_range: '$$',
        rating: 4.3,
        tags: ['trendy', 'innovative', 'creative', 'modern'],
        description: 'Creative fusion of Eastern and Western cuisines',
        latitude: hamburgLat + 0.003,
        longitude: hamburgLng - 0.003,
        is_active: true
      },
      {
        id: 'fusion-02',
        name: 'Global Kitchen',
        address: 'Neustadt 78, 20354 Hamburg',
        cuisine_type: 'Fusion',
        price_range: '$$$',
        rating: 4.5,
        tags: ['innovative', 'upscale', 'creative', 'trendy'],
        description: 'Innovative global fusion cuisine',
        latitude: hamburgLat - 0.002,
        longitude: hamburgLng - 0.002,
        is_active: true
      }
    ];

    console.log(`Preparing to create ${venues.length} test venues...`);
    
    // Use security definer function to create venues (bypasses RLS)
    const { error } = await supabase.rpc('create_test_venues', {
      venues_data: venues
    });

    if (error) {
      console.error('Error creating test venues:', error);
      throw error;
    }

    console.log(`🎉 Successfully created ${venues.length} enhanced test venues`);
    return true;
  } catch (error) {
    console.error('Error in createEnhancedTestVenues:', error);
    throw error;
  }
};