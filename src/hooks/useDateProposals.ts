import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuth } from '@/contexts/AuthContext';

export interface DateProposal {
  id: string;
  proposer_id: string;
  recipient_id: string;
  proposed_date: string;
  title: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  planning_session_id?: string;
}

export const useDateProposals = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<DateProposal[]>([]);

  const createProposal = async (
    recipientId: string,
    proposedDate: Date,
    title: string,
    message?: string
  ): Promise<DateProposal | null> => {
    if (!user) {
      handleError(new Error('User not authenticated'));
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('date_proposals')
        .insert({
          proposer_id: user.id,
          recipient_id: recipientId,
          proposed_date: proposedDate.toISOString(),
          title,
          message
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProposalStatus = async (
    proposalId: string,
    status: 'accepted' | 'declined'
  ): Promise<boolean> => {
    if (!user) {
      handleError(new Error('User not authenticated'));
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('date_proposals')
        .update({ status })
        .eq('id', proposalId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getMyProposals = async (): Promise<DateProposal[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('date_proposals')
        .select('*')
        .or(`proposer_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const proposalsData = data || [];
      setProposals(proposalsData);
      return proposalsData;
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelProposal = async (proposalId: string): Promise<boolean> => {
    const success = await updateProposalStatus(proposalId, 'declined');
    if (success) {
      // Update local state to remove the cancelled proposal
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    }
    return success;
  };

  const acceptProposal = async (proposalId: string): Promise<string | null> => {
    const success = await updateProposalStatus(proposalId, 'accepted');
    if (!success) return null;

    // Create collaborative planning session
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) return null;

      const { data, error } = await supabase
        .from('date_planning_sessions')
        .insert({
          initiator_id: proposal.proposer_id,
          partner_id: proposal.recipient_id,
          planning_mode: 'collaborative'
        })
        .select()
        .single();

      if (error) throw error;

      // Link the session to the proposal
      await supabase
        .from('date_proposals')
        .update({ planning_session_id: data.id })
        .eq('id', proposalId);

      return data.id;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  return {
    loading,
    proposals,
    createProposal,
    updateProposalStatus,
    getMyProposals,
    acceptProposal,
    cancelProposal
  };
};