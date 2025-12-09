import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  referralCode: string;
  referralCount: number;
  referralPointsEarned: number;
  pendingReferrals: number;
  completedReferrals: number;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  status: 'pending' | 'signed_up' | 'completed' | 'expired';
  signup_points_awarded: boolean;
  completion_points_awarded: boolean;
  created_at: string;
  completed_at: string | null;
}

export const getReferralCode = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_points')
    .select('referral_code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching referral code:', error);
    return null;
  }

  return data?.referral_code || null;
};

export const getReferralStats = async (): Promise<ReferralStats | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user points data
  const { data: pointsData, error: pointsError } = await supabase
    .from('user_points')
    .select('referral_code, referral_count, referral_points_earned')
    .eq('user_id', user.id)
    .maybeSingle();

  if (pointsError || !pointsData) {
    console.error('Error fetching referral stats:', pointsError);
    return null;
  }

  // Get referral breakdown
  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_id', user.id);

  if (referralsError) {
    console.error('Error fetching referrals:', referralsError);
  }

  const pendingReferrals = referrals?.filter(r => r.status === 'signed_up').length || 0;
  const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;

  return {
    referralCode: pointsData.referral_code || '',
    referralCount: pointsData.referral_count || 0,
    referralPointsEarned: pointsData.referral_points_earned || 0,
    pendingReferrals,
    completedReferrals,
  };
};

export const getReferralLink = (code: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?ref=${code}`;
};

export const validateReferralCode = async (code: string): Promise<{ valid: boolean; referrerId?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: { action: 'validate_code', referralCode: code },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return { valid: false };
  }
};

export const processReferralSignup = async (referralCode: string, refereeId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: { action: 'process_signup', referralCode, refereeId },
    });

    if (error) throw error;
    return data?.success || false;
  } catch (error) {
    console.error('Error processing referral signup:', error);
    return false;
  }
};

export const processFirstDateCompletion = async (refereeId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: { action: 'process_first_date', refereeId },
    });

    if (error) throw error;
    return data?.success || false;
  } catch (error) {
    console.error('Error processing first date completion:', error);
    return false;
  }
};

export const REFERRAL_BADGES = {
  first_referral: {
    id: 'first_referral',
    name: 'Ambassador',
    description: 'Referred your first friend',
    icon: '🤝',
    threshold: 1,
  },
  social_recruiter: {
    id: 'social_recruiter',
    name: 'Social Recruiter',
    description: 'Referred 5 friends',
    icon: '📣',
    threshold: 5,
  },
  community_builder: {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Referred 10 friends',
    icon: '🏗️',
    threshold: 10,
  },
  super_connector: {
    id: 'super_connector',
    name: 'Super Connector',
    description: 'Referred 25 friends',
    icon: '⭐',
    threshold: 25,
  },
};
