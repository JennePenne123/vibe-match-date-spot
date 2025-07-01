
import { useState } from 'react';

// Mock invitations data
const MOCK_INVITATIONS = [
  {
    id: 'invitation-1',
    sender_id: 'friend-1',
    recipient_id: 'mock-user-123',
    venue_id: 'venue-1',
    title: 'Coffee Date at Blue Bottle',
    message: 'Hey! Want to grab coffee this weekend?',
    proposed_date: '2024-07-15',
    status: 'pending' as const,
    created_at: '2024-07-01T10:00:00Z',
    ai_compatibility_score: 85,
    ai_reasoning: 'Great match based on your coffee preferences!',
    sender: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar_url: null
    },
    venue: {
      name: 'Blue Bottle Coffee',
      address: '123 Main St, Downtown',
      image_url: null
    }
  }
];

export const useMockInvitations = () => {
  const [invitations, setInvitations] = useState(MOCK_INVITATIONS);
  const [loading, setLoading] = useState(false);

  const acceptInvitation = async (invitationId: string) => {
    console.log('Mock: Accepting invitation', invitationId);
    setInvitations(prev => 
      prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: 'accepted' as const }
          : inv
      )
    );
  };

  const declineInvitation = async (invitationId: string) => {
    console.log('Mock: Declining invitation', invitationId);
    setInvitations(prev => 
      prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: 'declined' as const }
          : inv
      )
    );
  };

  const sendInvitation = async (recipientId: string, venueId: string, title: string, message?: string) => {
    console.log('Mock: Sending invitation', { recipientId, venueId, title, message });
    return true;
  };

  const submitDateFeedback = async (
    invitationId: string, 
    rating: number,
    venueRating: number,
    aiAccuracyRating: number,
    feedbackText?: string,
    wouldRecommendVenue?: boolean,
    wouldUseAiAgain?: boolean
  ) => {
    console.log('Mock: Submitting feedback', { 
      invitationId, 
      rating, 
      venueRating, 
      aiAccuracyRating,
      feedbackText,
      wouldRecommendVenue,
      wouldUseAiAgain 
    });
    return true;
  };

  const fetchInvitations = async () => {
    console.log('Mock: Fetching invitations');
    // Already have invitations loaded
  };

  return {
    invitations,
    loading,
    acceptInvitation,
    declineInvitation,
    sendInvitation,
    submitDateFeedback,
    fetchInvitations
  };
};
