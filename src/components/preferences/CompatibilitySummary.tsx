
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserPreferences {
  preferred_cuisines: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  preferred_vibes: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

interface CompatibilitySummaryProps {
  myPreferences: UserPreferences;
  partnerPreferences: UserPreferences;
}

const CompatibilitySummary: React.FC<CompatibilitySummaryProps> = ({
  myPreferences,
  partnerPreferences
}) => {
  const getMatchingItems = (myItems: string[], partnerItems: string[]) => {
    return myItems.filter(item => partnerItems.includes(item));
  };

  const hasMyPreferences = 
    (myPreferences.preferred_cuisines?.length > 0) ||
    (myPreferences.preferred_vibes?.length > 0) ||
    (myPreferences.preferred_times?.length > 0) ||
    (myPreferences.preferred_price_range?.length > 0);

  const hasPartnerPreferences = 
    (partnerPreferences.preferred_cuisines?.length > 0) ||
    (partnerPreferences.preferred_vibes?.length > 0) ||
    (partnerPreferences.preferred_times?.length > 0) ||
    (partnerPreferences.preferred_price_range?.length > 0);

  if (!hasMyPreferences && !hasPartnerPreferences) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-600">Compatibility Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            No preferences set for either user - please set preferences to see compatibility
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasMyPreferences || !hasPartnerPreferences) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Compatibility Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-yellow-700">
            {!hasMyPreferences ? "You haven't" : "Your partner hasn't"} set preferences yet - compatibility cannot be calculated
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-green-800">Compatibility Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {getMatchingItems(myPreferences.preferred_cuisines, partnerPreferences.preferred_cuisines).length}
            </div>
            <div className="text-xs text-green-700">Cuisine Matches</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {getMatchingItems(myPreferences.preferred_vibes, partnerPreferences.preferred_vibes).length}
            </div>
            <div className="text-xs text-green-700">Vibe Matches</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {getMatchingItems(myPreferences.preferred_times, partnerPreferences.preferred_times).length}
            </div>
            <div className="text-xs text-green-700">Time Matches</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {getMatchingItems(myPreferences.preferred_price_range, partnerPreferences.preferred_price_range).length}
            </div>
            <div className="text-xs text-green-700">Price Matches</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompatibilitySummary;
