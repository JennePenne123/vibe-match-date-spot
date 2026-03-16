
-- Security definer function: venue rankings by city for venue partners
CREATE OR REPLACE FUNCTION public.get_city_venue_rankings(_city text)
RETURNS TABLE (
  venue_id text,
  venue_name text,
  venue_address text,
  cuisine_type text,
  price_range text,
  visit_count bigint,
  avg_rating numeric,
  review_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only venue_partners or admins can call this
  IF NOT public.has_role(auth.uid(), 'venue_partner') AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only venue partners can view city rankings';
  END IF;

  RETURN QUERY
  SELECT
    v.id AS venue_id,
    v.name AS venue_name,
    v.address AS venue_address,
    v.cuisine_type,
    v.price_range,
    COUNT(DISTINCT di.id) FILTER (WHERE di.date_status = 'completed') AS visit_count,
    COALESCE(ROUND(AVG(df.rating)::numeric, 1), 0) AS avg_rating,
    COUNT(DISTINCT df.id) AS review_count
  FROM venues v
  LEFT JOIN date_invitations di ON di.venue_id = v.id AND di.date_status = 'completed'
  LEFT JOIN date_feedback df ON df.invitation_id = di.id
  WHERE v.is_active = true
    AND v.address ILIKE '%' || _city || '%'
  GROUP BY v.id, v.name, v.address, v.cuisine_type, v.price_range
  ORDER BY visit_count DESC, avg_rating DESC;
END;
$$;
