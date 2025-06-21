
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Star, MapPin, DollarSign, Filter, Sparkles } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const { appState } = useApp();
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
    navigate('/area');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 pt-12 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate('/area')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">Perfect Matches</h1>
              <p className="text-sm text-gray-600">{filteredVenues.length} spots found</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <Filter className="w-6 h-6" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === filterOption.id
                    ? 'bg-datespot-gradient text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{filterOption.icon}</span>
                {filterOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Top Recommendations
            </h2>
            <p className="text-sm text-gray-600">
              Sorted by best match • AI-powered
            </p>
          </div>

          <div className="space-y-4">
            {filteredVenues.map((venue, index) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-500 text-white font-semibold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {venue.matchScore}% match
                    </Badge>
                  </div>
                  <button
                    onClick={() => toggleLike(venue.id)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        likedVenues.includes(venue.id)
                          ? 'text-red-500 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                  {venue.discount && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-orange-500 text-white">
                        {venue.discount}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{venue.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{venue.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{venue.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {venue.location} • {venue.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {venue.priceRange}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate(`/venue/${venue.id}`)}
                    className="w-full bg-datespot-gradient text-white hover:opacity-90"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => navigate('/preferences')}
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Refine Preferences
            </Button>
            <Button
              onClick={() => navigate('/welcome')}
              className="w-full bg-datespot-gradient text-white hover:opacity-90"
            >
              Start New Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
