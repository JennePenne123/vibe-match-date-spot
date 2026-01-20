import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
interface CollaborativeWaitingStateProps {
  partnerName: string;
  sessionId: string;
  hasPartnerSetPreferences: boolean;
  isWaitingForPartner: boolean;
  bothPreferencesComplete?: boolean;
  onManualContinue?: () => void;
  // New props to clarify the user's own status
  hasCurrentUserSetPreferences?: boolean;
  currentUserName?: string;
}
const CollaborativeWaitingState: React.FC<CollaborativeWaitingStateProps> = ({
  partnerName,
  sessionId,
  hasPartnerSetPreferences,
  isWaitingForPartner,
  bothPreferencesComplete = false,
  onManualContinue,
  hasCurrentUserSetPreferences = true,
  currentUserName = 'You'
}) => {
  if (import.meta.env.DEV) {
    console.log('🔍 WAITING STATE: Rendering with props:', {
      partnerName,
      hasPartnerSetPreferences,
      isWaitingForPartner,
      bothPreferencesComplete,
      hasCurrentUserSetPreferences,
      currentUserName
    });
  }

  // Priority 1: If current user hasn't set preferences, show that first
  if (!hasCurrentUserSetPreferences) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="h-5 w-5" />
            Set Your Preferences First
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-blue-700 font-medium">
                You need to complete your date preferences
              </p>
              <p className="text-xs text-blue-600">
                Set your preferences first, then wait for {partnerName} to complete theirs
              </p>
            </div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Next steps:</strong> Complete the preferences form above to proceed with collaborative planning.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  // New state: Both users have set preferences, ready to continue
  if (bothPreferencesComplete && onManualContinue) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Both Preferences Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-green-700 font-medium">
                You and {partnerName} have both set your date preferences
              </p>
              <p className="text-xs text-green-600">
                Ready to start AI analysis and find perfect venues!
              </p>
            </div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 border border-green-200">
            <Button 
              onClick={onManualContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Start AI Analysis & Find Venues
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (isWaitingForPartner) {
    return <Card className="border-amber-200 bg-amber-50">
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
      </Card>;
  }
  if (!hasPartnerSetPreferences) {
    return <Card className="border-gray-200 bg-gray-50">
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
      </Card>;
  }
  return null;
};
export default CollaborativeWaitingState;