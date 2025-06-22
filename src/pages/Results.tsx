
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Star, MapPin, DollarSign, Filter, Sparkles } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const { appState } = useApp();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [filter, setFilter] = useState('all');
  const [likedVenues, setLikedVenues] = useState<string[]>([]);

  const { venues } = appState;

  const filters = [
    { id: 'all', name: 'All Spots', icon: '📍' },
    { id: 'romantic', name: 'Romantic', icon: '💕' },
    { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌃' },
    { id: 'casual', name: 'Casual', icon: '😊' }
  ];

  const filteredVenues = filter === 'all' 
    ? venues 
    : venues.filter(venue => venue.vibe === filter);

  const toggleLike = (venueId: string) => {
    setLikedVenues(prev =>
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  if (venues.length === 0) {
    navigate(isDemoMode ? '/area?demo=true' : '/area');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm p-4 pt-12 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate(isDemoMode ? '/area?demo=true' : '/area')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-white/50 rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 text-organic">Perfect Matches</h1>
              <p className="text-sm text-gray-600">{filteredVenues.length} magical spots found ✨</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-white/50 rounded-2xl"
            >
              <Filter className="w-6 h-6" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  filter === filterOption.id
                    ? 'bg-vyy-primary text-white shadow-lg animate-pulse-glow'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-md hover:shadow-lg'
                }`}
              >
                <span className="mr-2 text-lg">{filterOption.icon}</span>
                {filterOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-expressive text-organic">
              Top Recommendations
            </h2>
            <p className="text-gray-600">
              Sorted by best match • AI-powered magic ✨
            </p>
          </div>

          <div className="space-y-6">
            {filteredVenues.map((venue, index) => (
              <div
                key={venue.id}
                className="organic-card bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-102"
              >
                <div className="relative">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white font-bold text-sm px-3 py-1 rounded-2xl animate-pulse-glow">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {venue.matchScore}% match
                    </Badge>
                  </div>
                  <button
                    onClick={() => toggleLike(venue.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all hover:scale-110"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        likedVenues.includes(venue.id)
                          ? 'text-red-500 fill-current animate-pulse'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                  {venue.discount && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-orange-500 text-white font-bold rounded-2xl">
                        {venue.discount}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-900 text-organic">{venue.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold">{venue.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed">{venue.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {venue.location} • {venue.distance}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {venue.priceRange}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {venue.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs rounded-full bg-vyy-glow text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate(isDemoMode ? `/venue/${venue.id}?demo=true` : `/venue/${venue.id}`)}
                    className="w-full h-12 bg-vyy-primary hover:opacity-90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate(isDemoMode ? '/preferences?demo=true' : '/preferences')}
              variant="outline"
              className="w-full h-12 border-gray-200 text-gray-700 hover:bg-white/50 rounded-2xl"
            >
              Refine Preferences
            </Button>
            <Button
              onClick={() => navigate(isDemoMode ? '/welcome?demo=true' : '/welcome')}
              className="w-full h-12 bg-vyy-secondary hover:opacity-90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start New Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
