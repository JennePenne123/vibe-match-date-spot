
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
