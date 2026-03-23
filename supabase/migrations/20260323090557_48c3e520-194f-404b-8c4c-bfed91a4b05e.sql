
-- =============================================
-- 1. Add missing "Deny anonymous access" policies
-- =============================================

-- ai_compatibility_scores
CREATE POLICY "Deny anonymous access" ON public.ai_compatibility_scores FOR ALL TO anon USING (false);

-- ai_date_recommendations
CREATE POLICY "Deny anonymous access" ON public.ai_date_recommendations FOR ALL TO anon USING (false);

-- ai_venue_scores
CREATE POLICY "Deny anonymous access" ON public.ai_venue_scores FOR ALL TO anon USING (false);

-- api_usage_logs
CREATE POLICY "Deny anonymous access" ON public.api_usage_logs FOR ALL TO anon USING (false);

-- coding_conversations
CREATE POLICY "Deny anonymous access" ON public.coding_conversations FOR ALL TO anon USING (false);

-- coding_messages
CREATE POLICY "Deny anonymous access" ON public.coding_messages FOR ALL TO anon USING (false);

-- coding_task_logs
CREATE POLICY "Deny anonymous access" ON public.coding_task_logs FOR ALL TO anon USING (false);

-- date_planning_sessions
CREATE POLICY "Deny anonymous access" ON public.date_planning_sessions FOR ALL TO anon USING (false);

-- date_proposals
CREATE POLICY "Deny anonymous access" ON public.date_proposals FOR ALL TO anon USING (false);

-- feedback_rewards
CREATE POLICY "Deny anonymous access" ON public.feedback_rewards FOR ALL TO anon USING (false);

-- request_logs
CREATE POLICY "Deny anonymous access" ON public.request_logs FOR ALL TO anon USING (false);

-- user_venue_feedback
CREATE POLICY "Deny anonymous access" ON public.user_venue_feedback FOR ALL TO anon USING (false);

-- venue_partnerships (already has some anon policies but not a blanket deny)
-- Skip - it doesn't have anon deny but let's add one
CREATE POLICY "Deny anonymous access" ON public.venue_partnerships FOR ALL TO anon USING (false);

-- venues
CREATE POLICY "Deny anonymous access" ON public.venues FOR ALL TO anon USING (false);

-- voucher_redemptions
CREATE POLICY "Deny anonymous access" ON public.voucher_redemptions FOR ALL TO anon USING (false);

-- vouchers
CREATE POLICY "Deny anonymous access" ON public.vouchers FOR ALL TO anon USING (false);

-- =============================================
-- 2. Fix policies using {public} role → {authenticated}
-- =============================================

-- user_venue_feedback: INSERT
DROP POLICY "Users can insert own feedback" ON public.user_venue_feedback;
CREATE POLICY "Users can insert own feedback" ON public.user_venue_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- venue_partnerships: INSERT
DROP POLICY "Partners can create partnership requests" ON public.venue_partnerships;
CREATE POLICY "Partners can create partnership requests" ON public.venue_partnerships
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = partner_id) AND (status = 'pending'::text));

-- venues: INSERT (system)
DROP POLICY "System can create venues from trusted sources" ON public.venues;
CREATE POLICY "System can create venues from trusted sources" ON public.venues
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'venue_partner'::app_role) 
    OR (source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar']))
  );

-- venues: UPDATE (system)
DROP POLICY "System can update venues from trusted sources" ON public.venues;
CREATE POLICY "System can update venues from trusted sources" ON public.venues
  FOR UPDATE TO authenticated
  USING (source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar']))
  WITH CHECK (source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar']));

-- voucher_redemptions: INSERT
DROP POLICY "Users can create redemptions" ON public.voucher_redemptions;
CREATE POLICY "Users can create redemptions" ON public.voucher_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Upgrade profiles anon deny from SELECT-only to ALL
-- =============================================
DROP POLICY "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access" ON public.profiles FOR ALL TO anon USING (false);

-- =============================================
-- 4. Consolidate push_subscriptions anon deny (4 separate → 1 ALL)
-- =============================================
DROP POLICY "Deny anonymous delete on push subscriptions" ON public.push_subscriptions;
DROP POLICY "Deny anonymous insert on push subscriptions" ON public.push_subscriptions;
DROP POLICY "Deny anonymous select on push subscriptions" ON public.push_subscriptions;
DROP POLICY "Deny anonymous update on push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Deny anonymous access" ON public.push_subscriptions FOR ALL TO anon USING (false);
