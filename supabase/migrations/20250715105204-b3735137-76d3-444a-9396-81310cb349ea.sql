-- Add soft delete support to digital_assets
ALTER TABLE public.digital_assets 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Create collections table for smart collections
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('manual', 'smart', 'date', 'event', 'ai')),
  criteria JSONB, -- Store smart collection criteria
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_assets junction table
CREATE TABLE public.collection_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.digital_assets(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, asset_id)
);

-- Enable RLS on collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on collection_assets
ALTER TABLE public.collection_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for collection_assets
CREATE POLICY "Users can view their collection assets" 
ON public.collection_assets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.collections c 
    WHERE c.id = collection_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their collection assets" 
ON public.collection_assets 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.collections c 
    WHERE c.id = collection_id AND c.user_id = auth.uid()
  )
);

-- Add trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update digital_assets RLS policies to exclude soft deleted items
DROP POLICY "Users can view their own assets" ON public.digital_assets;

CREATE POLICY "Users can view their own active assets" 
ON public.digital_assets 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Create separate policy for viewing deleted assets (trash)
CREATE POLICY "Users can view their own deleted assets" 
ON public.digital_assets 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- Create function to detect potential duplicates
CREATE OR REPLACE FUNCTION public.find_potential_duplicates(target_user_id UUID)
RETURNS TABLE (
  asset1_id UUID,
  asset2_id UUID,
  similarity_score NUMERIC,
  match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    asset1_id,
    asset2_id,
    score as similarity_score,
    match_type
  FROM asset_pairs
  WHERE score > 0.5
  ORDER BY score DESC;
END;
$$;

-- Enable pg_trgm extension if not already enabled (for similarity function)
CREATE EXTENSION IF NOT EXISTS pg_trgm;