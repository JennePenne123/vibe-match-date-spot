
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Sparkles, Loader2 } from 'lucide-react';
import CollaborativePreferences from '@/components/CollaborativePreferences';
import SafeComponent from '@/components/SafeComponent';

interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: number | null;
  aiAnalyzing: boolean;
  onPreferencesComplete: () => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({
  sessionId,
  partnerId,
  partnerName,
  compatibilityScore,
  aiAnalyzing,
  onPreferencesComplete
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Planning Date with {partnerName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Session expires in 24h
            </Badge>
            {compatibilityScore !== null && (
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {compatibilityScore}% Compatible
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {aiAnalyzing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <h3 className="text-lg font-semibold text-blue-800">AI Analysis in Progress</h3>
            </div>
            <p className="text-blue-700">
              Analyzing compatibility and finding perfect venues...
            </p>
          </CardContent>
        </Card>
      )}

      <SafeComponent componentName="CollaborativePreferences">
        <CollaborativePreferences
          sessionId={sessionId}
          partnerId={partnerId}
          onPreferencesUpdated={onPreferencesComplete}
        />
      </SafeComponent>
    </div>
  );
};

export default PreferencesStep;
