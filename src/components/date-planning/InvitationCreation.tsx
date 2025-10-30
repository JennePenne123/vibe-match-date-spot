
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { MapPin, Sparkles, Loader2, Info } from 'lucide-react';
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
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
          <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-900 truncate">
              {selectedVenue.venue_name}
            </p>
            <p className="text-xs text-purple-600">Selected venue</p>
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-3 w-3 text-purple-600" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-xs text-muted-foreground">
                {selectedVenue.ai_reasoning}
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Your Invitation Message
          </label>
          <Textarea
            value={invitationMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write a personalized message..."
            rows={8}
            className="min-h-[200px] resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {invitationMessage.length} characters
          </p>
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
