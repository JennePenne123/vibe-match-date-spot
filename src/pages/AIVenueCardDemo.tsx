import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIVenueCard from '@/components/AIVenueCard';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { useNavigate } from 'react-router-dom';

const AIVenueCardDemo = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockRecommendation: AIVenueRecommendation = {
    venue_id: "demo-venue-1",
    venue_name: "The Garden Terrace",
    venue_address: "1234 Romantic Street, San Francisco, CA 94102",
    venue_image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    ai_score: 87,
    match_factors: {
      cuisine_match: true,
      price_match: true,
      vibe_matches: ["romantic", "intimate", "outdoor"],
      rating: 4.6,
      price_range: "$$",
      rating_bonus: 0.15
    },
    contextual_score: 0.12,
    ai_reasoning: "Perfect match for your Italian cuisine preference and romantic atmosphere desire. This highly-rated restaurant offers beautiful outdoor seating with garden views, making it ideal for an intimate dinner date. The moderate pricing fits your budget preferences perfectly.",
    confidence_level: 0.92
  };

  const handleVenueSelect = (venueId: string) => {
    console.log("Selected venue:", venueId);
    // In a real app, this would navigate to venue details or continue with selection
    alert(`Venue selected: ${venueId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AIVenueCard Demo
            </h1>
            <p className="text-gray-600 text-sm">
              Example of the AI-powered venue recommendation card
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Component Features:
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>AI Score & Confidence Display</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Interactive Feedback Buttons</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Expandable Match Details</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>AI Reasoning Explanation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Real-time Feedback Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Hover & Animation Effects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Live Example:
          </h2>
          
          <AIVenueCard
            recommendation={mockRecommendation}
            onSelect={handleVenueSelect}
            showAIInsights={true}
            compact={false}
            sessionContext={{
              sessionId: "demo-session-123",
              partnerId: "demo-partner-456"
            }}
          />
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Try These Interactions:
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <span className="font-medium">•</span>
              <span>Hover over the venue image to see the scale effect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">•</span>
              <span>Click "Match Details" to expand/collapse detailed scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">•</span>
              <span>Use the feedback buttons (❤️, ✨, 👎, etc.) to see real-time updates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">•</span>
              <span>Click "Select" button to see the selection action</span>
            </div>
          </div>
        </div>

        {/* Component Variants */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Compact Version:
          </h2>
          
          <AIVenueCard
            recommendation={{
              ...mockRecommendation,
              venue_name: "Cafe Luna (Compact View)",
              ai_score: 73,
              confidence_level: 0.78
            }}
            onSelect={handleVenueSelect}
            showAIInsights={false}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AIVenueCardDemo;