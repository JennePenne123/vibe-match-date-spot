-- Revoke all anon privileges on public tables to satisfy linter
-- RLS + authenticated-only policies already block anon, but table-level grants still exist

REVOKE ALL ON public.ai_compatibility_scores FROM anon;
REVOKE ALL ON public.ai_date_recommendations FROM anon;
REVOKE ALL ON public.ai_learning_data FROM anon;
REVOKE ALL ON public.ai_venue_scores FROM anon;
REVOKE ALL ON public.api_usage_logs FROM anon;
REVOKE ALL ON public.coding_conversations FROM anon;
REVOKE ALL ON public.coding_messages FROM anon;
REVOKE ALL ON public.coding_task_logs FROM anon;
REVOKE ALL ON public.date_feedback FROM anon;
REVOKE ALL ON public.date_invitations FROM anon;
REVOKE ALL ON public.date_planning_sessions FROM anon;
REVOKE ALL ON public.date_proposals FROM anon;
REVOKE ALL ON public.error_logs FROM anon;
REVOKE ALL ON public.feedback_rewards FROM anon;
REVOKE ALL ON public.friendships FROM anon;
REVOKE ALL ON public.invitation_messages FROM anon;
REVOKE ALL ON public.partner_exclusive_vouchers FROM anon;
REVOKE ALL ON public.partner_profiles FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.push_subscriptions FROM anon;
REVOKE ALL ON public.referrals FROM anon;
REVOKE ALL ON public.request_logs FROM anon;
REVOKE ALL ON public.reward_redemptions FROM anon;
REVOKE ALL ON public.user_points FROM anon;
REVOKE ALL ON public.user_preference_vectors FROM anon;
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_venue_feedback FROM anon;
REVOKE ALL ON public.venue_partnerships FROM anon;
REVOKE ALL ON public.venues FROM anon;
REVOKE ALL ON public.voucher_redemptions FROM anon;
REVOKE ALL ON public.vouchers FROM anon;

-- Also revoke default privileges for anon on future tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;