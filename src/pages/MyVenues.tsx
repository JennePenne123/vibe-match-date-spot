
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MapPin, Star, Clock, Search, Filter, Plus, Navigation } from 'lucide-react';

const MyVenues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  // Extended mock venues data
  const allVenues = [
    {
      id: 1,
      name: 'Sunset Rooftop Cafe',
      type: 'Coffee & Brunch',
      category: 'cafe',
      location: 'Downtown',
      address: '123 Main St, Downtown',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&fit=crop',
      rating: 4.8,
      priceRange: '$$',
      lastVisit: '2 weeks ago',
      isFavorite: true,
      dateCount: 3,
      tags: ['romantic', 'outdoor', 'view']
    },
    {
      id: 2,
      name: 'The Garden Bistro',
      type: 'Fine Dining',
      category: 'restaurant',
      location: 'Uptown',
      address: '456 Oak Ave, Uptown',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
      rating: 4.6,
      priceRange: '$$$',
      lastVisit: '1 month ago',
      isFavorite: true,
      dateCount: 2,
      tags: ['elegant', 'intimate', 'garden']
    },
    {
      id: 3,
      name: 'Art Gallery Lounge',
      type: 'Cultural',
      category: 'entertainment',
      location: 'Arts District',
      address: '789 Gallery Row, Arts District',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      rating: 4.5,
      priceRange: '$$',
      lastVisit: '3 weeks ago',
      isFavorite: false,
      dateCount: 1,
      tags: ['cultural', 'artistic', 'unique']
    },
    {
      id: 4,
      name: 'Beachside Bar & Grill',
      type: 'Casual Dining',
      category: 'bar',
      location: 'Waterfront',
      address: '321 Beach Blvd, Waterfront',
      image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=300&h=200&fit=crop',
      rating: 4.3,
      priceRange: '$$',
      lastVisit: '1 week ago',
      isFavorite: true,
      dateCount: 4,
      tags: ['casual', 'beachfront', 'relaxed']
    },
    {
      id: 5,
      name: 'Central Park Picnic Area',
      type: 'Outdoor',
      category: 'outdoor',
      location: 'Central Park',
      address: 'Central Park, Section B',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      rating: 4.7,
      priceRange: '$',
      lastVisit: '4 days ago',
      isFavorite: true,
      dateCount: 5,
      tags: ['outdoor', 'nature', 'budget-friendly']
    }
  ];

  const categories = [
    { id: 'all', name: 'All', count: allVenues.length },
    { id: 'cafe', name: 'Cafes', count: allVenues.filter(v => v.category === 'cafe').length },
    { id: 'restaurant', name: 'Restaurants', count: allVenues.filter(v => v.category === 'restaurant').length },
    { id: 'bar', name: 'Bars', count: allVenues.filter(v => v.category === 'bar').length },
    { id: 'entertainment', name: 'Entertainment', count: allVenues.filter(v => v.category === 'entertainment').length },
    { id: 'outdoor', name: 'Outdoor', count: allVenues.filter(v => v.category === 'outdoor').length }
  ];

  const filteredVenues = allVenues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || venue.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const favoriteVenues = allVenues.filter(v => v.isFavorite);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={() => navigate('/home')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">My Venues</h1>
            <p className="text-sm text-gray-600">{allVenues.length} places discovered</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-pink-600 border-pink-200 hover:bg-pink-50"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-pink-600">{allVenues.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{favoriteVenues.length}</div>
                <div className="text-xs text-gray-600">Favorites</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-green-600">
                  {allVenues.reduce((sum, venue) => sum + venue.dateCount, 0)}
                </div>
                <div className="text-xs text-gray-600">Dates</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className={`whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? "bg-gradient-to-r from-pink-400 to-rose-500 text-white" 
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>

          {/* Venues List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Venues' : 
                 categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-sm text-gray-500">{filteredVenues.length} results</span>
            </div>
            
            {filteredVenues.map((venue) => (
              <Card key={venue.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="relative">
                      <img 
                        src={venue.image} 
                        alt={venue.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      {venue.isFavorite && (
                        <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                          <Heart className="w-3 h-3 text-white" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {venue.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Star className="w-3 h-3" fill="currentColor" />
                          {venue.rating}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{venue.type}</span>
                        <span>{venue.priceRange}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {venue.location}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {venue.lastVisit}
                        </div>
                        <div className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-medium">
                          {venue.dateCount} visit{venue.dateCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mt-2">
                        {venue.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Navigation className="w-4 h-4 mr-1" />
                        Directions
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600">
                        <Plus className="w-4 h-4 mr-1" />
                        Plan Date
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Venue CTA */}
          <Card className="bg-gray-100 border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <MapPin className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-medium text-gray-600 mb-1">Discover New Places</h3>
              <p className="text-sm text-gray-500 mb-4">Add more venues to your collection</p>
              <Button
                onClick={() => navigate('/preferences')}
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
              >
                Explore Venues
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyVenues;
