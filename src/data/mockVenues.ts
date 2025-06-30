
import { Venue } from '@/types';

export const mockVenues: Venue[] = [
  {
    id: 'venue-1',
    name: 'Bella Notte',
    description: 'Authentic Italian restaurant with romantic ambiance and handmade pasta',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    rating: 4.8,
    distance: '0.3 mi',
    price_range: '$$$',
    address: '123 Main St, Downtown',
    cuisine_type: 'Italian',
    vibe: 'romantic',
    matchScore: 95,
    tags: ['romantic', 'pasta', 'wine', 'date night'],
    phone: '+1 (555) 123-4567',
    website: 'https://bellanotte.example.com',
    openingHours: ['Mon-Thu: 5:00 PM - 10:00 PM', 'Fri-Sat: 5:00 PM - 11:00 PM', 'Sun: 4:00 PM - 9:00 PM'],
    isOpen: true,
    // Compatibility fields
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    location: '123 Main St, Downtown',
    priceRange: '$$$'
  },
  {
    id: 'venue-2',
    name: 'Sakura Sushi',
    description: 'Fresh sushi and sashimi in a modern Japanese setting',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    rating: 4.6,
    distance: '0.7 mi',
    price_range: '$$',
    address: '456 Oak Ave, Arts District',
    cuisine_type: 'Japanese',
    vibe: 'casual',
    matchScore: 88,
    tags: ['sushi', 'fresh', 'modern', 'healthy'],
    phone: '+1 (555) 987-6543',
    openingHours: ['Tue-Sun: 11:30 AM - 9:00 PM', 'Mon: Closed'],
    isOpen: false,
    // Compatibility fields
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    location: '456 Oak Ave, Arts District',
    priceRange: '$$'
  },
  {
    id: 'venue-3',
    name: 'Taco Libre',
    description: 'Vibrant Mexican cantina with craft cocktails and street tacos',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    rating: 4.4,
    distance: '1.2 mi',
    price_range: '$$',
    address: '789 Pine St, Mission District',
    cuisine_type: 'Mexican',
    vibe: 'nightlife',
    matchScore: 82,
    tags: ['tacos', 'cocktails', 'lively', 'outdoor seating'],
    discount: '20% off appetizers',
    phone: '+1 (555) 456-7890',
    website: 'https://tacolibre.example.com',
    openingHours: ['Daily: 11:00 AM - 12:00 AM'],
    isOpen: true,
    // Compatibility fields
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    location: '789 Pine St, Mission District',
    priceRange: '$$'
  }
];
