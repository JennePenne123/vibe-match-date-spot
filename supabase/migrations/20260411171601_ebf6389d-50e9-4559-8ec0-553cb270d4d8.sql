
-- Function to delete all user data across all tables (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the user themselves can trigger this
  IF auth.uid() IS NULL OR auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete own account';
  END IF;

  -- Delete from all user-related tables
  DELETE FROM public.ai_learning_data WHERE user_id = target_user_id;
  DELETE FROM public.ai_venue_scores WHERE user_id = target_user_id;
  DELETE FROM public.ai_compatibility_scores WHERE user1_id = target_user_id OR user2_id = target_user_id;
  DELETE FROM public.ai_date_recommendations WHERE user1_id = target_user_id OR user2_id = target_user_id;
  DELETE FROM public.user_venue_feedback WHERE user_id = target_user_id;
  DELETE FROM public.user_preference_vectors WHERE user_id = target_user_id;
  DELETE FROM public.user_preferences WHERE user_id = target_user_id;
  DELETE FROM public.user_points WHERE user_id = target_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM public.referrals WHERE referrer_id = target_user_id OR referee_id = target_user_id;
  DELETE FROM public.reward_redemptions WHERE user_id = target_user_id;
  DELETE FROM public.feedback_rewards WHERE user_id = target_user_id;
  DELETE FROM public.date_feedback WHERE user_id = target_user_id;
  DELETE FROM public.invitation_messages WHERE sender_id = target_user_id;
  DELETE FROM public.date_proposals WHERE proposer_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.date_invitations WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.date_group_messages WHERE sender_id = target_user_id;
  DELETE FROM public.date_group_members WHERE user_id = target_user_id;
  DELETE FROM public.friendships WHERE user_id = target_user_id OR friend_id = target_user_id;
  DELETE FROM public.date_planning_sessions WHERE initiator_id = target_user_id OR partner_id = target_user_id;
  DELETE FROM public.error_logs WHERE user_id = target_user_id;
  DELETE FROM public.api_usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Function to cleanup old implicit signals (older than 12 months)
CREATE OR REPLACE FUNCTION public.cleanup_old_implicit_signals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.user_venue_feedback
  WHERE created_at < NOW() - INTERVAL '12 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
