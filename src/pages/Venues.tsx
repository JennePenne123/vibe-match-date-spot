
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MapPin, Star, Clock, Calendar } from 'lucide-react';

const Venues = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data for venues
  const favoriteVenues = [
    {
      id: 1,
      name: 'Sunset Rooftop Cafe',
      type: 'Coffee & Brunch',
      location: 'Downtown',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&fit=crop',
      rating: 4.8,
      lastVisit: '2 weeks ago',
      isFavorite: true,
      dateCount: 3
    },
    {
      id: 2,
      name: 'The Garden Bistro',
      type: 'Fine Dining',
      location: 'Uptown',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
      rating: 4.6,
      lastVisit: '1 month ago',
      isFavorite: true,
      dateCount: 2
    },
    {
      id: 3,
      name: 'Art Gallery Lounge',
      type: 'Cultural',
      location: 'Arts District',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      rating: 4.5,
      lastVisit: '3 weeks ago',
      isFavorite: false,
      dateCount: 1
    }
  ];

  const displayName = user?.profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 pt-12 bg-white shadow-sm">
          <Button
            onClick={() => navigate('/landing')}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">My Venues</h1>
            <p className="text-sm text-gray-600">Places you've loved</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Card */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-pink-600">{favoriteVenues.length}</div>
                  <div className="text-xs text-gray-600">Venues</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-600">
                    {favoriteVenues.reduce((sum, venue) => sum + venue.dateCount, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Dates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-600">
                    {favoriteVenues.filter(v => v.isFavorite).length}
                  </div>
                  <div className="text-xs text-gray-600">Favorites</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venues List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Venue Collection</h2>
            
            {favoriteVenues.map((venue) => (
              <Card key={venue.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="relative">
                      <img 
                        src={venue.image} 
                        alt={venue.name}
                        className="w-16 h-16 rounded-lg object-cover"
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
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {venue.location} • {venue.type}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {venue.lastVisit}
                        </div>
                        <div className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-medium">
                          {venue.dateCount} date{venue.dateCount !== 1 ? 's' : ''}
                        </div>
                      </div>
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
              <p className="text-sm text-gray-500 mb-4">Start a new date to add more venues to your collection</p>
              <Button
                onClick={() => navigate('/preferences')}
                className="bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
              >
                Find New Spots
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Venues;
