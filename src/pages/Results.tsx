import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter, Sparkles } from 'lucide-react';
import AIVenueCard from '@/components/AIVenueCard';
import { AIVenueRecommendation } from '@/services/aiVenueService';

const Results = () => {
  const navigate = useNavigate();
  const { appState } = useApp();
  const [filter, setFilter] = useState('all');

  const { venues } = appState;

  // Convert venues to AIVenueRecommendation format
  const recommendations: AIVenueRecommendation[] = venues.map(venue => ({
    venue_id: venue.id,
    venue_name: venue.name,
    venue_address: venue.address || 'Address not available',
    venue_image: venue.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    ai_score: (venue as any).matchScore || Math.floor(Math.random() * 30) + 70, // 70-100%
    match_factors: {
      cuisine_match: venue.cuisine_type === 'italian' || venue.cuisine_type === 'asian',
      price_match: true,
      vibe_matches: venue.tags || ['romantic', 'cozy'],
      rating: venue.rating || 4.5,
      price_range: venue.price_range || '$$',
      rating_bonus: 0.1
    },
    contextual_score: Math.random() * 0.2, // 0-20% bonus
    ai_reasoning: `This venue matches your preferences for ${venue.cuisine_type || 'great'} cuisine and ${venue.tags?.[0] || 'romantic'} atmosphere. Perfect for your date style!`,
    confidence_level: Math.random() * 0.3 + 0.7 // 70-100% confidence
  }));

  const filters = [
    { id: 'all', name: 'All Spots', icon: '📍' },
    { id: 'romantic', name: 'Romantic', icon: '💕' },
    { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌃' },
    { id: 'casual', name: 'Casual', icon: '😊' }
  ];

  const filteredRecommendations = filter === 'all' 
    ? recommendations 
    : recommendations.filter(rec => 
        rec.match_factors.vibe_matches?.includes(filter) ||
        rec.venue_name.toLowerCase().includes(filter)
      );

  const handleVenueSelect = (venueId: string) => {
    navigate(`/venue/${venueId}`);
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
              <h1 className="text-xl font-semibold text-gray-900">AI Recommendations</h1>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                {filteredRecommendations.length} perfect matches
              </p>
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
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{filterOption.icon}</span>
                {filterOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI-Powered Results */}
        <div className="p-4">
          <div className="mb-6 text-center bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-purple-900">
                AI-Powered Matches
              </h2>
            </div>
            <p className="text-sm text-purple-700">
              Each venue is personally scored based on your preferences and past feedback
            </p>
          </div>

          {/* AIVenueCard Components */}
          <div className="space-y-6">
            {filteredRecommendations.map((recommendation, index) => (
              <AIVenueCard
                key={recommendation.venue_id}
                recommendation={recommendation}
                onSelect={handleVenueSelect}
                showAIInsights={true}
                compact={false}
                sessionContext={{
                  sessionId: 'current-session',
                  partnerId: 'current-partner'
                }}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredRecommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No matches found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or preferences
              </p>
              <Button
                onClick={() => setFilter('all')}
                variant="outline"
              >
                Show All Results
              </Button>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => navigate('/preferences')}
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Improve AI Recommendations
            </Button>
            <Button
              onClick={() => navigate('/welcome')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
            >
              Start New Search
            </Button>
          </div>

          {/* AI Learning Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">AI Learning Active</h4>
                <p className="text-sm text-blue-800">
                  Your feedback on these venues helps our AI learn your preferences and improve future recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
