import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SmartPlannerDebugProps {
  currentUser?: any;
  selectedPartner?: any;
  currentSession?: any;
  compatibilityScore?: number | null;
  venueRecommendations?: any[];
  currentStep: string;
}

export const SmartPlannerDebug: React.FC<SmartPlannerDebugProps> = ({
  currentUser,
  selectedPartner,
  currentSession,
  compatibilityScore,
  venueRecommendations = [],
  currentStep
}) => {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-orange-800">
          🔧 Smart Planner Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <span className="font-medium">Current Step:</span>
          <Badge variant="outline" className="ml-2">{currentStep}</Badge>
        </div>
        
        {currentUser && (
          <div>
            <span className="font-medium">Current User:</span>
            <span className="ml-2">{currentUser.name} ({currentUser.email})</span>
          </div>
        )}
        
        {selectedPartner && (
          <div>
            <span className="font-medium">Selected Partner:</span>
            <span className="ml-2">{selectedPartner.name}</span>
          </div>
        )}
        
        {currentSession && (
          <>
            <Separator />
            <div>
              <span className="font-medium">Session ID:</span>
              <span className="ml-2 font-mono text-xs">{currentSession.id}</span>
            </div>
            <div>
              <span className="font-medium">Session Status:</span>
              <Badge variant="outline" className="ml-2">{currentSession.session_status}</Badge>
            </div>
            {currentSession.preferences_data && (
              <div>
                <span className="font-medium">Session Preferences:</span>
                <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-20">
                  {JSON.stringify(currentSession.preferences_data, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
        
        {compatibilityScore !== null && compatibilityScore !== undefined && (
          <>
            <Separator />
            <div>
              <span className="font-medium">Compatibility Score:</span>
              <Badge variant="secondary" className="ml-2">
                {compatibilityScore}%
              </Badge>
            </div>
          </>
        )}
        
        {venueRecommendations.length > 0 && (
          <>
            <Separator />
            <div>
              <span className="font-medium">Venue Recommendations:</span>
              <span className="ml-2">{venueRecommendations.length} venues</span>
            </div>
            <div className="space-y-1">
              {venueRecommendations.slice(0, 3).map((venue, idx) => (
                <div key={venue.venue_id} className="p-2 bg-white rounded">
                  <div className="font-medium">{venue.name}</div>
                  <div className="text-gray-600">
                    AI Score: {venue.ai_score} | Match: {venue.match_score}%
                  </div>
                  {venue.ai_reasoning && (
                    <div className="text-gray-500 text-xs mt-1">
                      {venue.ai_reasoning.slice(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
              {venueRecommendations.length > 3 && (
                <div className="text-gray-500">
                  +{venueRecommendations.length - 3} more venues
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};