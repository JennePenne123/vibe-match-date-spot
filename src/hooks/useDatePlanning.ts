
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
    console.log('🎯 DATE PLANNING: Starting session preferences update with location:', userLocation);

    // Update preferences first
    await updateSessionPreferences(sessionId, preferences);
    
    // Fetch session data to get partner ID for AI analysis
    try {
      const { data: sessionData, error } = await supabase
        .from('date_planning_sessions')
        .select('partner_id, initiator_id')
        .eq('id', sessionId)
        .single();
      
      if (error || !sessionData) {
        console.error('🎯 DATE PLANNING: Could not fetch session data for AI analysis:', error);
        return;
      }
      
      // Determine partner ID based on current user role
      const partnerId = sessionData.initiator_id === user?.id ? sessionData.partner_id : sessionData.initiator_id;
      
      if (!partnerId) {
        console.error('🎯 DATE PLANNING: Could not determine partner ID for AI analysis');
        return;
      }
      
      // Then trigger AI analysis with user location
      await analyzeCompatibilityAndVenues(sessionId, partnerId, preferences, userLocation);
    } catch (error) {
      console.error('🎯 DATE PLANNING: Error in session preferences update with AI:', error);
    }
  }, [updateSessionPreferences, analyzeCompatibilityAndVenues, userLocation, user?.id]);

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
    
    // Fetch session data based on sessionId to handle both solo and collaborative modes
    let sessionData = currentSession;
    if (!sessionData || sessionData.id !== sessionId) {
      console.log('💾 COMPLETE PLANNING SESSION - Fetching session data for sessionId:', sessionId);
      try {
        const { data: fetchedSession, error } = await supabase
          .from('date_planning_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();
          
        if (error) {
          console.error('💾 COMPLETE PLANNING SESSION - ERROR fetching session:', error);
          handleError(new Error('Failed to fetch session data'), {
            toastTitle: 'Session Error',
            toastDescription: 'Could not retrieve session information'
          });
          return false;
        }
        
        if (!fetchedSession) {
          console.error('💾 COMPLETE PLANNING SESSION - ERROR: Session not found for ID:', sessionId);
          handleError(new Error('Session not found'), {
            toastTitle: 'Session Error',
            toastDescription: 'Planning session not found'
          });
          return false;
        }
        
        sessionData = fetchedSession;
      } catch (error) {
        console.error('💾 COMPLETE PLANNING SESSION - ERROR fetching session:', error);
        handleError(new Error('Failed to fetch session data'), {
          toastTitle: 'Session Error',
          toastDescription: 'Could not retrieve session information'
        });
        return false;
      }
    }
    
    // Validate session has partner data
    if (!sessionData.partner_id && !sessionData.initiator_id) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No partner or initiator ID in session');
      handleError(new Error('Invalid session data'), {
        toastTitle: 'Session Error', 
        toastDescription: 'Session is missing required participant information'
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
      
      // Enhanced venue resolution and saving
      let finalVenueId = venueId;
      
      if (venueId) {
        // Check if venue exists in database first
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id')
          .eq('id', venueId)
          .single();
        
        if (!existingVenue) {
          // Find venue in recommendations (handles both AI and mock venues)
          const venue = venueRecommendations?.find(v => 
            v.venue_id === venueId || 
            v.id === venueId ||
            v.venue_name?.toLowerCase().includes(venueId.toLowerCase())
          );
          
          if (venue) {
            // Create venue record for both AI and mock venues
            const venueRecord = {
              id: venue.venue_id || venueId,
              name: venue.venue_name || venue.name || 'Unknown Venue',
              address: venue.location || venue.address || 'Unknown Location',
              description: venue.description || venue.ai_reasoning || '',
              cuisine_type: venue.cuisine_type || 'Mixed',
              price_range: venue.price_range || '$$',
              rating: venue.rating || 4.0,
              latitude: venue.coordinates?.lat || venue.latitude,
              longitude: venue.coordinates?.lng || venue.longitude,
              is_active: true,
              google_place_id: venue.google_place_id || venue.placeId
            };
            
            console.log('💾 COMPLETE PLANNING SESSION - Creating venue record:', venueRecord);
            
            const { error: venueError } = await supabase
              .from('venues')
              .upsert(venueRecord);
            
            if (venueError) {
              console.error('💾 COMPLETE PLANNING SESSION - Venue save error:', venueError);
              // Don't fail the invitation if venue save fails
            } else {
              finalVenueId = venueRecord.id;
              console.log('💾 COMPLETE PLANNING SESSION - Venue saved successfully:', finalVenueId);
            }
          } else {
            console.warn('💾 COMPLETE PLANNING SESSION - Venue not found in recommendations:', venueId);
            // Create a basic venue record to prevent foreign key errors
            const basicVenue = {
              id: venueId,
              name: `Venue ${venueId}`,
              address: 'Location TBD',
              description: 'Venue details to be updated',
              cuisine_type: 'Mixed',
              price_range: '$$',
              rating: 4.0,
              is_active: true
            };
            
            const { error: basicVenueError } = await supabase
              .from('venues')
              .upsert(basicVenue);
            
            if (basicVenueError) {
              console.error('💾 COMPLETE PLANNING SESSION - Basic venue creation failed:', basicVenueError);
            }
          }
        } else {
          console.log('💾 COMPLETE PLANNING SESSION - Venue already exists in database:', venueId);
        }
      }
      
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
      
      // Prepare invitation data with enhanced validation
      const recommendedVenue = venueRecommendations?.find(v => 
        v.venue_id === venueId || v.id === venueId
      );
      
      // Extract compatibility score properly
      let finalCompatibilityScore = null;
      if (typeof compatibilityScore === 'object' && compatibilityScore?.overall_score) {
        finalCompatibilityScore = compatibilityScore.overall_score;
      } else if (typeof compatibilityScore === 'number') {
        finalCompatibilityScore = compatibilityScore;
      }
      
      // Determine recipient ID based on user role in the session
      let recipientId;
      if (sessionData.initiator_id === user.id) {
        recipientId = sessionData.partner_id;
      } else if (sessionData.partner_id === user.id) {
        recipientId = sessionData.initiator_id;
      } else {
        console.error('💾 COMPLETE PLANNING SESSION - ERROR: User is not a participant in this session');
        handleError(new Error('User not authorized for this session'), {
          toastTitle: 'Authorization Error',
          toastDescription: 'You are not authorized to create invitations for this session'
        });
        return false;
      }
      
      if (!recipientId) {
        console.error('💾 COMPLETE PLANNING SESSION - ERROR: Could not determine recipient ID');
        handleError(new Error('Could not determine invitation recipient'), {
          toastTitle: 'Recipient Error',
          toastDescription: 'Unable to determine who should receive the invitation'
        });
        return false;
      }
      
      console.log('💾 COMPLETE PLANNING SESSION - Determined recipient:', {
        senderId: user.id,
        recipientId,
        userRole: sessionData.initiator_id === user.id ? 'initiator' : 'partner'
      });
      
      const invitationData = {
        sender_id: user.id,
        recipient_id: recipientId,
        venue_id: finalVenueId,
        title: 'AI-Matched Date Invitation',
        message: message,
        proposed_date: proposedDateTime?.toISOString(),
        planning_session_id: sessionId,
        ai_compatibility_score: finalCompatibilityScore || 0,
        ai_reasoning: recommendedVenue?.ai_reasoning || 'AI-powered venue recommendation',
        venue_match_factors: recommendedVenue, // Store the entire venue data for fallback
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

      // Mark related proposal as converted (if exists) - Enhanced logic
      try {
        // First, try to update by planning_session_id
        let proposalUpdated = false;
        
        const { data: sessionProposals, error: sessionUpdateError } = await supabase
          .from('date_proposals')
          .update({ status: 'converted' })
          .eq('planning_session_id', sessionId)
          .select();
        
        if (sessionUpdateError) {
          console.error('💾 COMPLETE PLANNING SESSION - Session ID update error:', sessionUpdateError);
        } else if (sessionProposals && sessionProposals.length > 0) {
          console.log('💾 COMPLETE PLANNING SESSION - Successfully marked proposal as converted via session ID:', sessionProposals.length);
          proposalUpdated = true;
        }

        // If no proposal was found by session ID, try to find and update by participants
        if (!proposalUpdated) {
          console.log('💾 COMPLETE PLANNING SESSION - No proposal found by session ID, trying participant match...');
          
          const { data: participantProposals, error: participantUpdateError } = await supabase
            .from('date_proposals')
            .update({ 
              status: 'converted',
              planning_session_id: sessionId // Also link it for future reference
            })
            .eq('status', 'accepted')
            .or(`and(proposer_id.eq.${sessionData.initiator_id},recipient_id.eq.${sessionData.partner_id}),and(proposer_id.eq.${sessionData.partner_id},recipient_id.eq.${sessionData.initiator_id})`)
            .select();
          
          if (participantUpdateError) {
            console.error('💾 COMPLETE PLANNING SESSION - Participant update error:', participantUpdateError);
          } else if (participantProposals && participantProposals.length > 0) {
            console.log('💾 COMPLETE PLANNING SESSION - Successfully marked proposal as converted via participants:', participantProposals.length);
            proposalUpdated = true;
          }
        }

        if (!proposalUpdated) {
          console.log('💾 COMPLETE PLANNING SESSION - No matching proposal found to convert');
        }
        
      } catch (error) {
        console.error('💾 COMPLETE PLANNING SESSION - Warning: Error updating proposal status:', error);
        // Don't fail the entire operation if proposal update fails
      }

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
