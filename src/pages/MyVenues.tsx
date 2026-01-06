
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, Heart, MapPin, Plus } from 'lucide-react';
import VenueCard from '@/components/VenueCard';
import { mockVenues } from '@/data/mockVenues';
import { Venue } from '@/types';

const MyVenues = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [likedVenues, setLikedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>(mockVenues);

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

  const toggleLike = (venueId: string) => {
    const newLikedVenues = likedVenues.includes(venueId)
      ? likedVenues.filter(id => id !== venueId)
      : [...likedVenues, venueId];
    
    setLikedVenues(newLikedVenues);
    localStorage.setItem('likedVenues', JSON.stringify(newLikedVenues));
  };

  const filteredVenues = venues.filter(venue => 
    likedVenues.includes(venue.id) &&
    (searchQuery === '' || 
     venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     venue.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     venue.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Venues</h1>
              <p className="text-sm text-muted-foreground">{displayName}'s favorite places</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search your venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {filteredVenues.length === 0 ? (
            <Card className="bg-card shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <Heart className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {likedVenues.length === 0 ? 'No Favorite Venues Yet' : 'No Matching Venues'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {likedVenues.length === 0 
                    ? 'Start exploring and add venues to your favorites!' 
                    : 'Try adjusting your search terms to find more venues.'
                  }
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/venues')}
                    className="w-full bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Discover Venues
                  </Button>
                  <Button
                    onClick={() => navigate('/preferences')}
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-muted"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Set Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredVenues.length} favorite venue{filteredVenues.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4">
                {filteredVenues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    isLiked={likedVenues.includes(venue.id)}
                    onToggleLike={toggleLike}
                    showMatchScore={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVenues;