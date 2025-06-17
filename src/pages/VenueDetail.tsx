
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, DollarSign, Clock, Phone, Share, Heart, Sparkles } from 'lucide-react';

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appState } = useApp();

  const venue = appState.venues.find(v => v.id === id);

  if (!venue) {
    navigate('/results');
    return null;
  }

  const mockDetails = {
    address: '123 Downtown Ave, City Center',
    phone: '+1 (555) 123-4567',
    hours: 'Mon-Thu: 5PM-11PM, Fri-Sun: 5PM-12AM',
    website: 'www.moonlightrooftop.com',
    features: ['Outdoor Seating', 'Live Music', 'Private Dining', 'Full Bar', 'Vegan Options'],
    reviews: [
      {
        user: 'Sarah M.',
        rating: 5,
        text: 'Perfect romantic spot! The rooftop views are incredible and the service was excellent.',
        date: '2 days ago'
      },
      {
        user: 'Mike R.',
        rating: 5,
        text: 'Great atmosphere for date night. The acoustic music created the perfect ambiance.',
        date: '1 week ago'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative">
        <img
          src={venue.image}
          alt={venue.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button
            onClick={() => navigate('/results')}
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            >
              <Share className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Match Score */}
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-green-500 text-white font-semibold text-base px-3 py-1">
            <Sparkles className="w-4 h-4 mr-2" />
            {venue.matchScore}% Perfect Match
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-semibold">{venue.rating}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{venue.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              {venue.distance}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              {venue.priceRange}
            </div>
          </div>

          {venue.discount && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">{venue.discount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Perfect For</h3>
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Contact & Hours</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{mockDetails.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{mockDetails.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{mockDetails.hours}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
          <div className="grid grid-cols-2 gap-2">
            {mockDetails.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {mockDetails.reviews.map((review, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">{review.user}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                <p className="text-sm text-gray-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full h-12 bg-datespot-gradient text-white hover:opacity-90 font-semibold">
            Make Reservation
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12">
              Get Directions
            </Button>
            <Button variant="outline" className="h-12">
              Call Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
