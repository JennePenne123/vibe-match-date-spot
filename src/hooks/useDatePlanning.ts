
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { supabase } from '@/integrations/supabase/client';

interface DatePreferences {
  preferred_cuisines?: string[];
  preferred_price_range?: string[];
  preferred_times?: string[];
  preferred_vibes?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
  preferred_date?: Date;
  preferred_time?: string;
}

export const useDatePlanning = (userLocation?: { latitude: number; longitude: number; address?: string }) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  
  // Use focused hooks
  const {
    currentSession,
    setCurrentSession,
    loading,
    createPlanningSession,
    getActiveSession,
    updateSessionPreferences,
    completePlanningSession: completeSession
  } = useSessionManagement();

  const {
    compatibilityScore,
    setCompatibilityScore,
    venueRecommendations,
    setVenueRecommendations,
    venueSearchError,
    analyzeCompatibilityAndVenues,
    resetAIState
  } = useAIAnalysis();

  // Set up real-time subscription
  useSessionRealtime(
    currentSession,
    setCurrentSession,
    setCompatibilityScore
  );

  // Enhanced update session preferences with AI analysis
  const updateSessionPreferencesWithAI = useCallback(async (sessionId: string, preferences: DatePreferences) => {
    if (!currentSession) return;

    console.log('🎯 DATE PLANNING: Starting session preferences update with location:', userLocation);

    // Update preferences first
    await updateSessionPreferences(sessionId, preferences);
    
    // Then trigger AI analysis with user location
    await analyzeCompatibilityAndVenues(sessionId, currentSession.partner_id, preferences, userLocation);
  }, [currentSession, updateSessionPreferences, analyzeCompatibilityAndVenues, userLocation]);

  // Enhanced complete planning session with invitation creation
  const completePlanningSession = useCallback(async (sessionId: string, venueId: string, message: string, preferences?: DatePreferences) => {
    console.log('🚀 COMPLETE PLANNING SESSION - Starting with:', {
      sessionId,
      venueId,
      hasUser: !!user,
      userId: user?.id,
      hasCurrentSession: !!currentSession,
      currentSessionPartnerId: currentSession?.partner_id,
      messageLength: message?.length || 0,
      compatibilityScore,
      venueRecommendationsCount: venueRecommendations?.length || 0,
      actualVenueRecommendations: venueRecommendations
    });

    // Enhanced validation with detailed error logging
    if (!user?.id) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No authenticated user or user ID');
      handleError(new Error('User authentication required'), {
        toastTitle: 'Authentication Error',
        toastDescription: 'Please sign in to send invitations'
      });
      return false;
    }
    
    if (!currentSession?.partner_id) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No current session or partner ID');
      handleError(new Error('No active planning session'), {
        toastTitle: 'Session Error', 
        toastDescription: 'No active planning session found'
      });
      return false;
    }

    if (!venueId) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No venue ID provided');
      handleError(new Error('No venue selected'), {
        toastTitle: 'Venue Required',
        toastDescription: 'Please select a venue for your invitation'
      });
      return false;
    }

    if (!message?.trim()) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No invitation message provided');
      handleError(new Error('No invitation message'), {
        toastTitle: 'Message Required',
        toastDescription: 'Please add a message to your invitation'
      });
      return false;
    }

    try {
      console.log('💾 COMPLETE PLANNING SESSION - Step 1: Completing session...');
      // Complete session first
      const sessionCompleted = await completeSession(sessionId, venueId);
      console.log('💾 COMPLETE PLANNING SESSION - Session completion result:', sessionCompleted);
      
      if (!sessionCompleted) {
        console.error('💾 COMPLETE PLANNING SESSION - ERROR: Session completion failed');
        handleError(new Error('Failed to complete planning session'), {
          toastTitle: 'Session Error',
          toastDescription: 'Unable to complete planning session'
        });
        return false;
      }

      console.log('💾 COMPLETE PLANNING SESSION - Step 2: Finding selected venue...');
      console.log('💾 COMPLETE PLANNING SESSION - Looking for venueId:', venueId);
      console.log('💾 COMPLETE PLANNING SESSION - Available venues:', venueRecommendations.map(v => ({
        id: v.id,
        venue_id: v.venue_id,
        venue_name: v.venue_name,
        name: v.name
      })));
      
      // Create the invitation with AI insights
      let selectedVenue = venueRecommendations.find(v => v.id === venueId || v.venue_id === venueId);
      
      // If we can't find the venue in recommendations, try to reconstruct it from the message/ai_reasoning
      if (!selectedVenue && message) {
        console.log('🔧 VENUE RECONSTRUCTION - selectedVenue not found, reconstructing from message');
        // Extract venue name from message 
        const venueNameMatch = message.match(/take you to ([^.]+)/);
        const venueName = venueNameMatch ? venueNameMatch[1].trim() : 'AI Recommended Venue';
        
        selectedVenue = {
          id: venueId,
          venue_id: venueId,
          venue_name: venueName,
          name: venueName,
          venue_address: 'Location extracted from AI analysis',
          ai_reasoning: `Recommended venue: ${venueName}`,
          // Try to get some basic data that might be available
          rating: 4.5,
          price_range: '$$'
        };
        console.log('🔧 VENUE RECONSTRUCTION - Reconstructed venue:', selectedVenue);
      }
      
      console.log('💾 COMPLETE PLANNING SESSION - Selected venue:', {
        found: !!selectedVenue,
        venueName: selectedVenue?.venue_name || selectedVenue?.name,
        venueId: selectedVenue?.venue_id || selectedVenue?.id,
        photos: selectedVenue?.venue_photos || selectedVenue?.photos,
        aiReasoning: selectedVenue?.ai_reasoning?.substring(0, 50) + '...'
      });
      
      console.log('💾 COMPLETE PLANNING SESSION - Step 3: Creating invitation in database...');
      
      // Combine selected date and time if available
      let proposedDateTime = null;
      if (preferences?.preferred_date && preferences?.preferred_time) {
        const [hours, minutes] = preferences.preferred_time.split(':');
        proposedDateTime = new Date(preferences.preferred_date);
        proposedDateTime.setHours(parseInt(hours), parseInt(minutes) || 0, 0, 0);
      } else if (preferences?.preferred_date) {
        proposedDateTime = preferences.preferred_date;
      }
      
      let finalVenueId = venueId;
      
      // If we have venue data from AI recommendations, save it to database first
      if (selectedVenue && venueId.startsWith('venue_')) {
        console.log('🔄 SAVE VENUE - Saving AI venue to database:', selectedVenue.venue_name);
        
        const venueToSave = {
          name: selectedVenue.venue_name || 'Unknown Venue',
          address: selectedVenue.venue_address || selectedVenue.address || selectedVenue.location || 'Address not available',
          google_place_id: selectedVenue.venue_id || selectedVenue.place_id,
          rating: selectedVenue.rating || null,
          price_range: selectedVenue.priceRange || selectedVenue.price_range || '$$',
          cuisine_type: selectedVenue.cuisine_type || selectedVenue.cuisineType || 'Restaurant',
          phone: selectedVenue.phone || null,
          opening_hours: selectedVenue.operatingHours || selectedVenue.opening_hours || null,
          image_url: selectedVenue.venue_image || selectedVenue.image_url || selectedVenue.image,
          photos: selectedVenue.venue_photos || selectedVenue.photos || [],
          tags: selectedVenue.amenities || selectedVenue.tags || [],
          is_active: true
        };

        const { data: savedVenue, error: venueError } = await supabase
          .from('venues')
          .insert(venueToSave)
          .select('id')
          .single();

        if (venueError) {
          console.error('🚨 SAVE VENUE - Failed to save venue:', venueError);
          // Continue with original venueId if save fails
        } else {
          finalVenueId = savedVenue.id;
          console.log('✅ SAVE VENUE - Venue saved with ID:', finalVenueId);
        }
      }
      
      const invitationData = {
        sender_id: user.id,
        recipient_id: currentSession.partner_id,
        venue_id: finalVenueId,
        title: 'AI-Matched Date Invitation',
        message: message,
        proposed_date: proposedDateTime?.toISOString(),
        planning_session_id: sessionId,
        ai_compatibility_score: compatibilityScore || 0,
        ai_reasoning: selectedVenue?.ai_reasoning || 'AI-powered venue recommendation',
        venue_match_factors: selectedVenue, // Store the entire venue data for fallback
        status: 'pending'
      };
      
      console.log('💾 COMPLETE PLANNING SESSION - Invitation data to insert:', {
        ...invitationData,
        venue_match_factors: 'object', // Don't log the full object
        message: message.substring(0, 50) + '...'
      });

      // Verify user is authenticated before database insert
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('💾 COMPLETE PLANNING SESSION - AUTH ERROR:', authError);
        handleError(new Error('Authentication failed during invitation creation'), {
          toastTitle: 'Authentication Error',
          toastDescription: 'Please sign in again and try again'
        });
        return false;
      }

      console.log('💾 COMPLETE PLANNING SESSION - Auth verified, inserting invitation...');
      
      const { data: insertedInvitation, error: inviteError } = await supabase
        .from('date_invitations')
        .insert(invitationData)
        .select()
        .single();

      if (inviteError) {
        console.error('💾 COMPLETE PLANNING SESSION - DATABASE ERROR:', {
          error: inviteError,
          code: inviteError.code,
          message: inviteError.message,
          details: inviteError.details,
          hint: inviteError.hint
        });
        
        // Provide specific error messages based on error type
        let errorTitle = 'Database Error';
        let errorDescription = 'Failed to create invitation';
        
        if (inviteError.code === '23503') {
          errorTitle = 'Invalid Data';
          errorDescription = 'Invalid venue or user data';
        } else if (inviteError.code === '42501') {
          errorTitle = 'Permission Error';
          errorDescription = 'Insufficient permissions to create invitation';
        } else if (inviteError.message?.includes('RLS')) {
          errorTitle = 'Access Error';
          errorDescription = 'Unable to access invitation system';
        }
        
        handleError(inviteError, {
          toastTitle: errorTitle,
          toastDescription: errorDescription
        });
        throw inviteError;
      }

      console.log('💾 COMPLETE PLANNING SESSION - Invitation created successfully:', insertedInvitation);

      // Reset AI state
      resetAIState();
      
      console.log('💾 COMPLETE PLANNING SESSION - SUCCESS! Planning session and invitation completed successfully');
      return true;
    } catch (error) {
      console.error('💾 COMPLETE PLANNING SESSION - CATCH ERROR:', error);
      handleError(error, {
        toastTitle: 'Failed to send invitation',
        toastDescription: 'Please try again'
      });
      return false;
    }
  }, [user, currentSession, completeSession, venueRecommendations, compatibilityScore, resetAIState, handleError]);

  return {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    venueSearchError,
    analyzeCompatibilityAndVenues,
    createPlanningSession,
    updateSessionPreferences: updateSessionPreferencesWithAI,
    getActiveSession,
    completePlanningSession
  };
};
