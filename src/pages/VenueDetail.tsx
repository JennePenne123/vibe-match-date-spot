
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, DollarSign, Clock, Phone, Share, Heart, Sparkles, Globe, ExternalLink } from 'lucide-react';

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appState } = useApp();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const venue = appState.venues.find(v => v.id === id);

  if (!venue) {
    navigate(isDemoMode ? '/results?demo=true' : '/results');
    return null;
  }

  const openDirections = () => {
    if (venue.placeId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${venue.placeId}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ' ' + venue.location)}`, '_blank');
    }
  };

  const callVenue = () => {
    if (venue.phone) {
      window.open(`tel:${venue.phone}`);
    }
  };

  const visitWebsite = () => {
    if (venue.website) {
      window.open(venue.website, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm">
      <div className="w-full max-w-md mx-auto">
        {/* Header Image */}
        <div className="relative">
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-72 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Header Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button
              onClick={() => navigate(isDemoMode ? '/results?demo=true' : '/results')}
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-2xl"
              >
                <Share className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-2xl"
              >
                <Heart className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Match Score */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-green-500 text-white font-bold text-lg px-4 py-2 rounded-2xl animate-pulse-glow">
              <Sparkles className="w-5 h-5 mr-2" />
              {venue.matchScore}% Perfect Match
            </Badge>
          </div>

          {/* Open Status */}
          {venue.isOpen !== undefined && (
            <div className="absolute bottom-4 right-4">
              <Badge className={`font-bold text-sm px-3 py-1 rounded-2xl ${venue.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                {venue.isOpen ? "Open Now ✨" : "Closed"}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Basic Info */}
          <div className="organic-card bg-white/90 backdrop-blur-sm p-8 shadow-2xl mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 text-expressive text-organic">{venue.name}</h1>
              <div className="flex items-center gap-2 bg-vyy-glow rounded-full px-3 py-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-bold text-lg">{venue.rating}</span>
              </div>
            </div>

            <p className="text-gray-700 mb-6 text-lg leading-relaxed">{venue.description}</p>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-vyy-coral" />
                <span className="font-medium">{venue.distance}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <DollarSign className="w-5 h-5 text-vyy-coral" />
                <span className="font-medium">{venue.priceRange}</span>
              </div>
            </div>

            {venue.discount && (
              <div className="mt-6 organic-card bg-orange-50/80 backdrop-blur-sm border-2 border-orange-200 p-4">
                <div className="flex items-center gap-3 text-orange-700">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">{venue.discount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="organic-card bg-white/90 backdrop-blur-sm p-8 shadow-xl mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg text-organic">Perfect For</h3>
            <div className="flex flex-wrap gap-3">
              {venue.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-vyy-glow text-gray-700 font-medium px-3 py-1 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact Info & Hours */}
          <div className="organic-card bg-white/90 backdrop-blur-sm p-8 shadow-xl mb-6">
            <h3 className="font-bold text-gray-900 mb-6 text-lg text-organic">Contact & Hours</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <MapPin className="w-6 h-6 text-vyy-coral" />
                <span className="text-gray-700 font-medium">{venue.location}</span>
              </div>
              {venue.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-vyy-coral" />
                  <span className="text-gray-700 font-medium">{venue.phone}</span>
                </div>
              )}
              {venue.website && (
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-vyy-coral" />
                  <a 
                    href={venue.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-vyy-coral hover:underline font-medium flex items-center gap-2"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              {venue.openingHours && venue.openingHours.length > 0 && (
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-vyy-coral mt-1" />
                  <div className="text-gray-700">
                    <div className="font-bold mb-2">Hours:</div>
                    {venue.openingHours.slice(0, 3).map((hours, index) => (
                      <div key={index} className="text-sm mb-1">{hours}</div>
                    ))}
                    {venue.openingHours.length > 3 && (
                      <div className="text-sm text-gray-500">+ {venue.openingHours.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button className="w-full h-14 bg-vyy-primary hover:opacity-90 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all animate-organic-morph">
              <Sparkles className="w-5 h-5 mr-2" />
              Make Reservation
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-12 border-gray-200 hover:bg-white/50 rounded-2xl"
                onClick={openDirections}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </Button>
              <Button 
                variant="outline" 
                className="h-12 border-gray-200 hover:bg-white/50 rounded-2xl"
                onClick={venue.phone ? callVenue : visitWebsite}
              >
                {venue.phone ? (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
