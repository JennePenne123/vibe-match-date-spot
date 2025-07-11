
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import VenueCard from '@/components/VenueCard';
import { mockVenues } from '@/data/mockVenues';
import { Venue } from '@/types';

const Venues = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [likedVenues, setLikedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>(mockVenues);

  const filters = ['Italian', 'Japanese', 'Mexican', 'American', 'Romantic', 'Casual', 'Nightlife'];

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    // Load liked venues from localStorage
    const saved = localStorage.getItem('likedVenues');
    if (saved) {
      setLikedVenues(JSON.parse(saved));
    }
  }, []);

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleLike = (venueId: string) => {
    const newLikedVenues = likedVenues.includes(venueId)
      ? likedVenues.filter(id => id !== venueId)
      : [...likedVenues, venueId];
    
    setLikedVenues(newLikedVenues);
    localStorage.setItem('likedVenues', JSON.stringify(newLikedVenues));
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = searchQuery === '' || 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = selectedFilters.length === 0 || 
      selectedFilters.some(filter => 
        venue.cuisine_type?.toLowerCase().includes(filter.toLowerCase()) ||
        venue.tags?.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
      );

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 pt-12 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Discover Venues</h1>
              <p className="text-sm text-gray-600">Find your perfect date spot</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter}
                  variant={selectedFilters.includes(filter) ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    selectedFilters.includes(filter) 
                      ? 'bg-datespot-coral text-white hover:bg-datespot-dark-coral' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
            </p>
            <Button
              onClick={() => navigate('/my-venues')}
              variant="outline"
              size="sm"
              className="border-datespot-light-coral text-datespot-dark-coral hover:bg-datespot-light-coral"
            >
              <MapPin className="w-4 h-4 mr-1" />
              My Venues ({likedVenues.length})
            </Button>
          </div>

          <div className="space-y-4">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                isLiked={likedVenues.includes(venue.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Venues;
