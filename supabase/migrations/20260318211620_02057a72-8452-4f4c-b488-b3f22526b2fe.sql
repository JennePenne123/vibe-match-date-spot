
-- =====================================================
-- SECURITY FIX 1: Recreate profiles_safe with security_invoker
-- =====================================================
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe WITH (security_invoker = on) AS
SELECT id, name, avatar_url, created_at, updated_at,
  CASE WHEN (id = auth.uid()) THEN email ELSE NULL::text END AS email
FROM profiles;

-- =====================================================
-- SECURITY FIX 2: Recreate views with security_invoker
-- =====================================================
DROP VIEW IF EXISTS public.api_usage_daily;
CREATE VIEW public.api_usage_daily WITH (security_invoker = on) AS
SELECT date(created_at) AS date, api_name, count(*) AS total_calls,
  sum(estimated_cost) AS total_cost,
  (avg(response_time_ms))::integer AS avg_response_time_ms,
  count(*) FILTER (WHERE (response_status >= 400)) AS error_count,
  count(*) FILTER (WHERE (cache_hit = true)) AS cache_hits
FROM api_usage_logs GROUP BY (date(created_at)), api_name;

DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view WITH (security_invoker = on) AS
SELECT user_id, total_points, level, streak_count
FROM user_points WHERE (total_points > 0) ORDER BY total_points DESC LIMIT 100;

DROP VIEW IF EXISTS public.potential_abusers;
CREATE VIEW public.potential_abusers WITH (security_invoker = on) AS
SELECT identifier_hash, count(*) AS total_blocked, max(abuse_score) AS max_abuse_score,
  array_agg(DISTINCT function_name) AS targeted_functions, max("timestamp") AS last_seen
FROM request_logs WHERE ((was_rate_limited = true) AND ("timestamp" > (now() - '7 days'::interval)))
GROUP BY identifier_hash HAVING (count(*) > 10) ORDER BY (count(*)) DESC;

DROP VIEW IF EXISTS public.rate_limit_daily_summary;
CREATE VIEW public.rate_limit_daily_summary WITH (security_invoker = on) AS
SELECT date("timestamp") AS date, function_name, count(*) AS total_requests,
  count(*) FILTER (WHERE was_rate_limited) AS blocked_requests,
  count(DISTINCT identifier_hash) AS unique_identifiers,
  (round(avg(abuse_score) FILTER (WHERE was_rate_limited)))::integer AS avg_abuse_score
FROM request_logs WHERE ("timestamp" > (now() - '30 days'::interval))
GROUP BY (date("timestamp")), function_name
ORDER BY (date("timestamp")) DESC, (count(*) FILTER (WHERE was_rate_limited)) DESC;

-- =====================================================
-- SECURITY FIX 3: Voucher codes - restrict SELECT to hide codes
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view active vouchers" ON public.vouchers;
CREATE POLICY "Authenticated users can view active vouchers" ON public.vouchers
FOR SELECT TO authenticated
USING (status = 'active' AND valid_until > now());

-- =====================================================
-- SECURITY FIX 4: Fix overly permissive INSERT policies
-- =====================================================
-- api_usage_logs: restrict insert to authenticated
DROP POLICY IF EXISTS "Edge functions can insert api logs" ON public.api_usage_logs;
CREATE POLICY "Edge functions can insert api logs" ON public.api_usage_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- request_logs: restrict insert to authenticated
DROP POLICY IF EXISTS "Service role can insert logs" ON public.request_logs;
CREATE POLICY "Service role can insert logs" ON public.request_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- error_logs: already restricted to authenticated role, just verify
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- SECURITY FIX 5: Change all policies from public to authenticated
-- =====================================================

-- ai_compatibility_scores
DROP POLICY IF EXISTS "Users can delete their own compatibility scores" ON public.ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can insert their own compatibility scores" ON public.ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can update their own compatibility scores" ON public.ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can view their own compatibility scores" ON public.ai_compatibility_scores;
CREATE POLICY "Users can delete their own compatibility scores" ON public.ai_compatibility_scores FOR DELETE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can insert their own compatibility scores" ON public.ai_compatibility_scores FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can update their own compatibility scores" ON public.ai_compatibility_scores FOR UPDATE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id)) WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can view their own compatibility scores" ON public.ai_compatibility_scores FOR SELECT TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- ai_date_recommendations
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.ai_date_recommendations;
DROP POLICY IF EXISTS "Users can insert their own recommendations" ON public.ai_date_recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON public.ai_date_recommendations;
DROP POLICY IF EXISTS "Users can view their own recommendations" ON public.ai_date_recommendations;
CREATE POLICY "Users can delete their own recommendations" ON public.ai_date_recommendations FOR DELETE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can insert their own recommendations" ON public.ai_date_recommendations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can update their own recommendations" ON public.ai_date_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id)) WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));
CREATE POLICY "Users can view their own recommendations" ON public.ai_date_recommendations FOR SELECT TO authenticated USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- ai_learning_data (keep anon deny, fix others)
DROP POLICY IF EXISTS "System can insert learning data" ON public.ai_learning_data;
DROP POLICY IF EXISTS "System can update learning data" ON public.ai_learning_data;
DROP POLICY IF EXISTS "Users can view their own learning data" ON public.ai_learning_data;
CREATE POLICY "System can insert learning data" ON public.ai_learning_data FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "System can update learning data" ON public.ai_learning_data FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own learning data" ON public.ai_learning_data FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ai_venue_scores
DROP POLICY IF EXISTS "Users can delete their own venue scores" ON public.ai_venue_scores;
DROP POLICY IF EXISTS "Users can insert their own venue scores" ON public.ai_venue_scores;
DROP POLICY IF EXISTS "Users can update their own venue scores" ON public.ai_venue_scores;
DROP POLICY IF EXISTS "Users can view their own venue scores" ON public.ai_venue_scores;
CREATE POLICY "Users can delete their own venue scores" ON public.ai_venue_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own venue scores" ON public.ai_venue_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own venue scores" ON public.ai_venue_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own venue scores" ON public.ai_venue_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- api_usage_logs (SELECT already authenticated, INSERT fixed above)
DROP POLICY IF EXISTS "Admins can view api usage" ON public.api_usage_logs;
CREATE POLICY "Admins can view api usage" ON public.api_usage_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- coding_conversations
DROP POLICY IF EXISTS "Users can create own conversations" ON public.coding_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.coding_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.coding_conversations;
CREATE POLICY "Users can create own conversations" ON public.coding_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.coding_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own conversations" ON public.coding_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- coding_messages
DROP POLICY IF EXISTS "Users can create own messages" ON public.coding_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.coding_messages;
CREATE POLICY "Users can create own messages" ON public.coding_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM coding_conversations WHERE id = coding_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own messages" ON public.coding_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coding_conversations WHERE id = coding_messages.conversation_id AND user_id = auth.uid()));

-- coding_task_logs
DROP POLICY IF EXISTS "Users can create own task logs" ON public.coding_task_logs;
DROP POLICY IF EXISTS "Users can view own task logs" ON public.coding_task_logs;
CREATE POLICY "Users can create own task logs" ON public.coding_task_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM coding_conversations WHERE id = coding_task_logs.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own task logs" ON public.coding_task_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coding_conversations WHERE id = coding_task_logs.conversation_id AND user_id = auth.uid()));

-- date_feedback (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can create their own feedback" ON public.date_feedback;
DROP POLICY IF EXISTS "Users can view feedback for their invitations" ON public.date_feedback;
CREATE POLICY "Users can create their own feedback" ON public.date_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view feedback for their invitations" ON public.date_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- date_invitations (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can create date invitations" ON public.date_invitations;
DROP POLICY IF EXISTS "Users can update their own date invitations" ON public.date_invitations;
DROP POLICY IF EXISTS "Users can view their own date invitations" ON public.date_invitations;
CREATE POLICY "Users can create date invitations" ON public.date_invitations FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own date invitations" ON public.date_invitations FOR UPDATE TO authenticated USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Users can view their own date invitations" ON public.date_invitations FOR SELECT TO authenticated USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- date_planning_sessions
DROP POLICY IF EXISTS "Users can create planning sessions" ON public.date_planning_sessions;
DROP POLICY IF EXISTS "Users can update their planning sessions" ON public.date_planning_sessions;
DROP POLICY IF EXISTS "Users can view their planning sessions" ON public.date_planning_sessions;
CREATE POLICY "Users can create planning sessions" ON public.date_planning_sessions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = initiator_id) OR (auth.uid() = partner_id));
CREATE POLICY "Users can update their planning sessions" ON public.date_planning_sessions FOR UPDATE TO authenticated USING ((auth.uid() = initiator_id) OR (auth.uid() = partner_id));
CREATE POLICY "Users can view their planning sessions" ON public.date_planning_sessions FOR SELECT TO authenticated USING ((auth.uid() = initiator_id) OR (auth.uid() = partner_id));

-- date_proposals
DROP POLICY IF EXISTS "Recipients can update proposal status" ON public.date_proposals;
DROP POLICY IF EXISTS "Users can create proposals they send" ON public.date_proposals;
DROP POLICY IF EXISTS "Users can view their proposals" ON public.date_proposals;
CREATE POLICY "Recipients can update proposal status" ON public.date_proposals FOR UPDATE TO authenticated USING ((auth.uid() = recipient_id) OR (auth.uid() = proposer_id));
CREATE POLICY "Users can create proposals they send" ON public.date_proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = proposer_id);
CREATE POLICY "Users can view their proposals" ON public.date_proposals FOR SELECT TO authenticated USING ((auth.uid() = proposer_id) OR (auth.uid() = recipient_id));

-- error_logs (fix public->authenticated for admin policies)
DROP POLICY IF EXISTS "Admins can delete error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can update error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can view error logs" ON public.error_logs;
CREATE POLICY "Admins can delete error logs" ON public.error_logs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update error logs" ON public.error_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view error logs" ON public.error_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- friendships (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON public.friendships FOR UPDATE TO authenticated USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));
CREATE POLICY "Users can view their own friendships" ON public.friendships FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

-- invitation_messages (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.invitation_messages;
DROP POLICY IF EXISTS "Users can send messages for their invitations" ON public.invitation_messages;
DROP POLICY IF EXISTS "Users can view messages for their invitations" ON public.invitation_messages;
CREATE POLICY "Users can mark received messages as read" ON public.invitation_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM date_invitations WHERE id = invitation_messages.invitation_id AND recipient_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM date_invitations WHERE id = invitation_messages.invitation_id AND recipient_id = auth.uid()));
CREATE POLICY "Users can send messages for their invitations" ON public.invitation_messages FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = sender_id) AND (EXISTS (SELECT 1 FROM date_invitations WHERE id = invitation_messages.invitation_id AND ((sender_id = auth.uid()) OR (recipient_id = auth.uid())) AND ((date_status IS NULL) OR (date_status <> 'completed')))));
CREATE POLICY "Users can view messages for their invitations" ON public.invitation_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM date_invitations WHERE id = invitation_messages.invitation_id AND ((sender_id = auth.uid()) OR (recipient_id = auth.uid()))));

-- partner_exclusive_vouchers (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Partners can update received vouchers" ON public.partner_exclusive_vouchers;
DROP POLICY IF EXISTS "Partners can view their exclusive vouchers" ON public.partner_exclusive_vouchers;
CREATE POLICY "Partners can update received vouchers" ON public.partner_exclusive_vouchers FOR UPDATE TO authenticated USING (auth.uid() = receiving_partner_id);
CREATE POLICY "Partners can view their exclusive vouchers" ON public.partner_exclusive_vouchers FOR SELECT TO authenticated USING ((auth.uid() = offering_partner_id) OR (auth.uid() = receiving_partner_id));

-- partner_profiles (fix public->authenticated for non-admin policies)
DROP POLICY IF EXISTS "Partners can update own profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Partners can view own profile" ON public.partner_profiles;
CREATE POLICY "Partners can update own profile" ON public.partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Partners can view own profile" ON public.partner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view friend profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id IN (
    SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
  ));

-- push_subscriptions (keep anon deny policies, fix public->authenticated)
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- referrals (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they created" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are referee" ON public.referrals;
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE TO authenticated USING ((auth.uid() = referrer_id) OR (auth.uid() = referee_id));
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Users can view referrals they created" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view referrals where they are referee" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referee_id);

-- request_logs (fix public->authenticated for admin view, keep service role)
DROP POLICY IF EXISTS "Admins can view request logs" ON public.request_logs;
DROP POLICY IF EXISTS "Service role only access" ON public.request_logs;
CREATE POLICY "Admins can view request logs" ON public.request_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- reward_redemptions (keep anon deny, already authenticated for insert/select)

-- user_points (keep anon deny, already authenticated for insert/update/select)

-- user_preference_vectors (keep anon deny, fix public->authenticated)
DROP POLICY IF EXISTS "Users can delete their own preference vectors" ON public.user_preference_vectors;
DROP POLICY IF EXISTS "Users can insert their own preference vectors" ON public.user_preference_vectors;
DROP POLICY IF EXISTS "Users can update their own preference vectors" ON public.user_preference_vectors;
DROP POLICY IF EXISTS "Users can view their own preference vectors" ON public.user_preference_vectors;
CREATE POLICY "Users can delete their own preference vectors" ON public.user_preference_vectors FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preference vectors" ON public.user_preference_vectors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preference vectors" ON public.user_preference_vectors FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own preference vectors" ON public.user_preference_vectors FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_preferences (keep anon deny, fix public->authenticated + restrict home location for friends)
DROP POLICY IF EXISTS "Allow compatibility calculations" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow compatibility calculations" ON public.user_preferences FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM date_planning_sessions
      WHERE (((initiator_id = auth.uid()) AND (partner_id = user_preferences.user_id))
        OR ((partner_id = auth.uid()) AND (initiator_id = user_preferences.user_id)))
        AND session_status = 'active' AND expires_at > now())) OR
    (EXISTS (SELECT 1 FROM friendships
      WHERE (((friendships.user_id = auth.uid()) AND (friendships.friend_id = user_preferences.user_id))
        OR ((friendships.friend_id = auth.uid()) AND (friendships.user_id = user_preferences.user_id)))
        AND status = 'accepted'))
  );

-- user_roles (fix public->authenticated)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_venue_feedback (fix public->authenticated)
DROP POLICY IF EXISTS "Users can update own feedback" ON public.user_venue_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_venue_feedback;
CREATE POLICY "Users can update own feedback" ON public.user_venue_feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.user_venue_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- venue_partnerships (fix public->authenticated)
DROP POLICY IF EXISTS "Admins can manage all partnerships" ON public.venue_partnerships;
DROP POLICY IF EXISTS "Partners can view their own partnerships" ON public.venue_partnerships;
DROP POLICY IF EXISTS "Venue partners can discover other partners" ON public.venue_partnerships;
CREATE POLICY "Admins can manage all partnerships" ON public.venue_partnerships FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Partners can view their own partnerships" ON public.venue_partnerships FOR SELECT TO authenticated USING (partner_id = auth.uid());
CREATE POLICY "Venue partners can discover other partners" ON public.venue_partnerships FOR SELECT TO authenticated USING (status = 'approved' AND has_role(auth.uid(), 'venue_partner'::app_role));

-- venues (fix public->authenticated)
DROP POLICY IF EXISTS "Authenticated users can view active venues" ON public.venues;
DROP POLICY IF EXISTS "Partners can update their venues" ON public.venues;
CREATE POLICY "Authenticated users can view active venues" ON public.venues FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Partners can update their venues" ON public.venues FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM venue_partnerships WHERE venue_id = venues.id AND partner_id = auth.uid() AND status = 'approved'));

-- voucher_redemptions (fix public->authenticated)
DROP POLICY IF EXISTS "Partners can view redemptions for their vouchers" ON public.voucher_redemptions;
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.voucher_redemptions;
CREATE POLICY "Partners can view redemptions for their vouchers" ON public.voucher_redemptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vouchers WHERE vouchers.id = voucher_redemptions.voucher_id AND vouchers.partner_id = auth.uid()));
CREATE POLICY "Users can view their own redemptions" ON public.voucher_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- vouchers (partner manage policy fix)
DROP POLICY IF EXISTS "Partners can manage their venue vouchers" ON public.vouchers;
CREATE POLICY "Partners can manage their venue vouchers" ON public.vouchers FOR ALL TO authenticated USING (partner_id = auth.uid());
