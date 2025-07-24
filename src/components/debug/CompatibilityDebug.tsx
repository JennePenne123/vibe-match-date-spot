import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompatibilityScore } from '@/services/aiMatchingService';

interface CompatibilityDebugProps {
  compatibilityScore: CompatibilityScore | number | null;
  partnerId?: string;
  userId?: string;
}

const CompatibilityDebug: React.FC<CompatibilityDebugProps> = ({
  compatibilityScore,
  partnerId,
  userId
}) => {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">
          🐛 Compatibility Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="font-medium">User ID:</span> {userId || 'Not set'}
        </div>
        <div>
          <span className="font-medium">Partner ID:</span> {partnerId || 'Not set'}
        </div>
        <div>
          <span className="font-medium">Score Type:</span>{' '}
          <Badge variant="outline">
            {compatibilityScore === null 
              ? 'null' 
              : typeof compatibilityScore === 'number' 
                ? 'number' 
                : 'object'
            }
          </Badge>
        </div>
        
        {typeof compatibilityScore === 'object' && compatibilityScore && (
          <div className="space-y-2">
            <div className="font-medium text-green-700">✅ Detailed Scores:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Overall: {Math.round(compatibilityScore.overall_score * 100)}%</div>
              <div>Cuisine: {Math.round(compatibilityScore.cuisine_score * 100)}%</div>
              <div>Vibe: {Math.round(compatibilityScore.vibe_score * 100)}%</div>
              <div>Price: {Math.round(compatibilityScore.price_score * 100)}%</div>
              <div>Timing: {Math.round(compatibilityScore.timing_score * 100)}%</div>
              <div>Activity: {Math.round(compatibilityScore.activity_score * 100)}%</div>
            </div>
            
            {compatibilityScore.compatibility_factors && (
              <div className="space-y-1">
                <div className="font-medium text-blue-700">Shared Preferences:</div>
                <div className="text-xs">
                  <div>Cuisines: {compatibilityScore.compatibility_factors.shared_cuisines?.join(', ') || 'None'}</div>
                  <div>Vibes: {compatibilityScore.compatibility_factors.shared_vibes?.join(', ') || 'None'}</div>
                  <div>Price: {compatibilityScore.compatibility_factors.shared_price_ranges?.join(', ') || 'None'}</div>
                  <div>Times: {compatibilityScore.compatibility_factors.shared_times?.join(', ') || 'None'}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {typeof compatibilityScore === 'number' && (
          <div>
            <span className="font-medium">Score Value:</span> {compatibilityScore}%
          </div>
        )}
        
        {compatibilityScore === null && (
          <div className="text-red-600">
            ❌ No compatibility score calculated
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompatibilityDebug;