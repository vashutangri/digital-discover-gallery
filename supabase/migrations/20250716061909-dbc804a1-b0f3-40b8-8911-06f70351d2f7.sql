-- Fix the find_potential_duplicates function to resolve ambiguous column references
CREATE OR REPLACE FUNCTION public.find_potential_duplicates(target_user_id uuid)
RETURNS TABLE(asset1_id uuid, asset2_id uuid, similarity_score numeric, match_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH asset_pairs AS (
    SELECT 
      a1.id as asset1_id,
      a2.id as asset2_id,
      CASE 
        WHEN a1.size = a2.size AND a1.name = a2.name THEN 1.0
        WHEN a1.size = a2.size THEN 0.8
        WHEN similarity(a1.name, a2.name) > 0.7 THEN 0.6
        ELSE 0.0
      END as score,
      CASE 
        WHEN a1.size = a2.size AND a1.name = a2.name THEN 'exact'
        WHEN a1.size = a2.size THEN 'size_match'
        WHEN similarity(a1.name, a2.name) > 0.7 THEN 'name_similar'
        ELSE 'none'
      END as match_type
    FROM public.digital_assets a1
    CROSS JOIN public.digital_assets a2
    WHERE a1.user_id = target_user_id 
      AND a2.user_id = target_user_id
      AND a1.id < a2.id
      AND a1.deleted_at IS NULL
      AND a2.deleted_at IS NULL
  )
  SELECT 
    asset_pairs.asset1_id,
    asset_pairs.asset2_id,
    asset_pairs.score as similarity_score,
    asset_pairs.match_type
  FROM asset_pairs
  WHERE asset_pairs.score > 0.5
  ORDER BY asset_pairs.score DESC;
END;
$function$