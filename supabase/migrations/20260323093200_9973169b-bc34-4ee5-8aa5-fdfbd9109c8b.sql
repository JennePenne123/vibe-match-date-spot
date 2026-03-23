-- Remove redundant permissive anon deny policies (all real policies are already TO authenticated)

DROP POLICY IF EXISTS "Deny anonymous access" ON public.ai_compatibility_scores;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.ai_date_recommendations;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.ai_learning_data;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.ai_venue_scores;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.coding_conversations;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.coding_messages;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.coding_task_logs;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.date_feedback;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.date_invitations;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.date_planning_sessions;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.date_proposals;
DROP POLICY IF EXISTS "Deny anonymous access to error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.feedback_rewards;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.friendships;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.invitation_messages;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.partner_exclusive_vouchers;
DROP POLICY IF EXISTS "Deny anonymous access to partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.referrals;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.request_logs;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_points;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_preference_vectors;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_preferences;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_roles;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.user_venue_feedback;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.venue_partnerships;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.venues;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.vouchers;

-- Tighten error_logs INSERT policy (was WITH CHECK true)
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);