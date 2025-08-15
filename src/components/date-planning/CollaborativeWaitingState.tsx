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
                Waiting for {partnerName} to set their date preferences
              </p>
              <p className="text-xs text-amber-600">
                AI will analyze compatibility and suggest venues once both partners complete preferences
              </p>
            </div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Next steps:</strong> Once {partnerName} completes their date preferences, 
              our AI will analyze your compatibility and recommend perfect venues for both of you.
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
                {partnerName} hasn't set their date preferences yet
              </p>
              <p className="text-xs text-gray-600">
                Waiting for them to complete their date preferences before AI analysis can begin.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Session ID:</strong> {sessionId.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-600 mt-1">
              AI analysis will automatically start when both partners have completed their date preferences.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default CollaborativeWaitingState;