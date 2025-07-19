
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Sparkles, Loader2 } from 'lucide-react';
import { AIVenueRecommendation } from '@/services/aiVenueService';

interface InvitationCreationProps {
  partnerName: string;
  selectedVenue: AIVenueRecommendation;
  invitationMessage: string;
  loading: boolean;
  onMessageChange: (message: string) => void;
  onSendInvitation: () => void;
}

const InvitationCreation: React.FC<InvitationCreationProps> = ({
  partnerName,
  selectedVenue,
  invitationMessage,
  loading,
  onMessageChange,
  onSendInvitation
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Send Smart Invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2">Selected Venue</h3>
          <p className="text-purple-700">{selectedVenue.venue_name}</p>
          <p className="text-sm text-purple-600 mt-1">{selectedVenue.ai_reasoning}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Invitation Message
          </label>
          <Textarea
            value={invitationMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write a personalized message..."
            rows={4}
          />
        </div>

        <Button 
          onClick={() => {
            console.log('🚀 BUTTON CLICK - Send Smart Invitation button clicked!');
            onSendInvitation();
          }}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Smart Invitation
              <Sparkles className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InvitationCreation;
