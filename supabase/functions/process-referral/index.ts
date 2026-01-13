import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REFERRAL_POINTS = {
  REFERRER_SIGNUP: 25,
  REFEREE_SIGNUP: 10,
  REFERRER_COMPLETION: 50,
  REFEREE_COMPLETION: 25,
}

const REFERRAL_BADGES = {
  FIRST_REFERRAL: { id: 'first_referral', threshold: 1 },
  SOCIAL_RECRUITER: { id: 'social_recruiter', threshold: 5 },
  COMMUNITY_BUILDER: { id: 'community_builder', threshold: 10 },
  SUPER_CONNECTOR: { id: 'super_connector', threshold: 25 },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rate limiting with logging for database operations
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'process-referral', RATE_LIMITS.DATABASE_OP, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 PROCESS-REFERRAL: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const { action, referralCode, refereeId, invitationId } = await req.json()
    console.log(`Processing referral action: ${action}`, { referralCode, refereeId, invitationId })

    // For validate_code action, no auth required (used during signup)
    // For other actions, require authentication
    if (action !== 'validate_code') {
      // 1. Extract and verify JWT token
      const authHeader = req.headers.get('authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 2. Create client with anon key for auth verification
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })
      
      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 3. Validate refereeId matches authenticated user for signup and first_date actions
      if ((action === 'process_signup' || action === 'process_first_date') && refereeId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Cannot process referral for other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 4. Now safe to use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'validate_code') {
      // Check if referral code exists and is valid
      const { data: referrerPoints, error } = await supabase
        .from('user_points')
        .select('user_id, referral_code')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle()

      if (error || !referrerPoints) {
        console.log('Invalid referral code:', referralCode)
        return new Response(
          JSON.stringify({ valid: false, message: 'Invalid referral code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Valid referral code found for user:', referrerPoints.user_id)
      return new Response(
        JSON.stringify({ valid: true, referrerId: referrerPoints.user_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'process_signup') {
      // Process referral when new user signs up
      const { data: referrerPoints, error: findError } = await supabase
        .from('user_points')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle()

      if (findError || !referrerPoints) {
        console.log('Referrer not found for code:', referralCode)
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid referral code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const referrerId = referrerPoints.user_id

      // Create referral record
      const { error: createError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          referral_code: referralCode.toUpperCase(),
          status: 'signed_up',
          signup_points_awarded: true,
        })

      if (createError) {
        console.error('Error creating referral:', createError)
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to process referral' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Award points to referrer
      const { data: currentReferrerPoints } = await supabase
        .from('user_points')
        .select('total_points, referral_count, referral_points_earned, badges')
        .eq('user_id', referrerId)
        .single()

      const newReferralCount = (currentReferrerPoints?.referral_count || 0) + 1
      const newBadges = [...(currentReferrerPoints?.badges || [])]

      // Check for badge unlocks
      for (const [, badge] of Object.entries(REFERRAL_BADGES)) {
        if (newReferralCount >= badge.threshold && !newBadges.includes(badge.id)) {
          newBadges.push(badge.id)
          console.log(`Badge unlocked for referrer: ${badge.id}`)
        }
      }

      await supabase
        .from('user_points')
        .update({
          total_points: (currentReferrerPoints?.total_points || 0) + REFERRAL_POINTS.REFERRER_SIGNUP,
          referral_count: newReferralCount,
          referral_points_earned: (currentReferrerPoints?.referral_points_earned || 0) + REFERRAL_POINTS.REFERRER_SIGNUP,
          badges: newBadges,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', referrerId)

      // Award welcome bonus to referee
      const { data: refereePointsData } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', refereeId)
        .single()

      await supabase
        .from('user_points')
        .update({
          total_points: (refereePointsData?.total_points || 0) + REFERRAL_POINTS.REFEREE_SIGNUP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', refereeId)

      console.log(`Referral processed: Referrer +${REFERRAL_POINTS.REFERRER_SIGNUP}pts, Referee +${REFERRAL_POINTS.REFEREE_SIGNUP}pts`)

      return new Response(
        JSON.stringify({
          success: true,
          referrerPoints: REFERRAL_POINTS.REFERRER_SIGNUP,
          refereePoints: REFERRAL_POINTS.REFEREE_SIGNUP,
          badgesUnlocked: newBadges.filter(b => !(currentReferrerPoints?.badges || []).includes(b)),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'process_first_date') {
      // Award completion bonus when referee completes first date
      const { data: referral, error: findError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_id', refereeId)
        .eq('status', 'signed_up')
        .eq('completion_points_awarded', false)
        .maybeSingle()

      if (findError || !referral) {
        console.log('No eligible referral found for completion bonus')
        return new Response(
          JSON.stringify({ success: false, message: 'No eligible referral' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update referral status
      await supabase
        .from('referrals')
        .update({
          status: 'completed',
          completion_points_awarded: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', referral.id)

      // Award completion bonus to referrer
      const { data: referrerPoints } = await supabase
        .from('user_points')
        .select('total_points, referral_points_earned')
        .eq('user_id', referral.referrer_id)
        .single()

      await supabase
        .from('user_points')
        .update({
          total_points: (referrerPoints?.total_points || 0) + REFERRAL_POINTS.REFERRER_COMPLETION,
          referral_points_earned: (referrerPoints?.referral_points_earned || 0) + REFERRAL_POINTS.REFERRER_COMPLETION,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', referral.referrer_id)

      // Award completion bonus to referee
      const { data: refereePoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', refereeId)
        .single()

      await supabase
        .from('user_points')
        .update({
          total_points: (refereePoints?.total_points || 0) + REFERRAL_POINTS.REFEREE_COMPLETION,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', refereeId)

      console.log(`First date completion bonus: Referrer +${REFERRAL_POINTS.REFERRER_COMPLETION}pts, Referee +${REFERRAL_POINTS.REFEREE_COMPLETION}pts`)

      return new Response(
        JSON.stringify({
          success: true,
          referrerPoints: REFERRAL_POINTS.REFERRER_COMPLETION,
          refereePoints: REFERRAL_POINTS.REFEREE_COMPLETION,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error processing referral:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
