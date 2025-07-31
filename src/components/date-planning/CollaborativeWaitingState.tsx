import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CollaborativeWaitingStateProps {
  partnerName: string;
  sessionId: string;
  hasPartnerSetPreferences: boolean;
  isWaitingForPartner: boolean;
}

const CollaborativeWaitingState: React.FC<CollaborativeWaitingStateProps> = ({
  partnerName,
  sessionId,
  hasPartnerSetPreferences,
  isWaitingForPartner
}) => {
  if (isWaitingForPartner) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Clock className="h-5 w-5" />
            Waiting for {partnerName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <div>
              <p className="text-sm text-amber-700 font-medium">
                {partnerName} needs to set their preferences
              </p>
              <p className="text-xs text-amber-600">
                You'll see AI recommendations once they complete their preferences
              </p>
            </div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Next steps:</strong> Once {partnerName} sets their preferences, 
              you'll both see AI-matched venues based on your compatibility.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasPartnerSetPreferences) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <AlertCircle className="h-5 w-5" />
            Waiting for {partnerName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-700 font-medium">
                {partnerName} has not gone through the selection of preferences
              </p>
              <p className="text-xs text-gray-600">
                Please wait for them to complete their preferences.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Session ID:</strong> {sessionId.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-600 mt-1">
              We'll automatically show the AI results when both of you have set your preferences.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default CollaborativeWaitingState;