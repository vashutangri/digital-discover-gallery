-- Add additional metadata fields to digital_assets table for comprehensive file tracking
ALTER TABLE public.digital_assets 
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN last_viewed TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_modified TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN exif_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN ai_description TEXT,
ADD COLUMN ai_objects TEXT[],
ADD COLUMN ai_text_content TEXT;

-- Create index for better performance on view tracking
CREATE INDEX idx_digital_assets_view_count ON public.digital_assets(view_count);
CREATE INDEX idx_digital_assets_last_viewed ON public.digital_assets(last_viewed);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(asset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.digital_assets 
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    last_viewed = now()
  WHERE id = asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update last_modified when metadata changes
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_modified
  BEFORE UPDATE ON public.digital_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_modified();