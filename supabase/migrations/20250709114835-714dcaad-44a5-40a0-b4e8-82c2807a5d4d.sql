-- Create storage bucket for digital assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('digital-assets', 'digital-assets', true);

-- Create digital_assets table
CREATE TABLE public.digital_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on digital_assets table
ALTER TABLE public.digital_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for digital_assets
CREATE POLICY "Users can view their own assets" 
ON public.digital_assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assets" 
ON public.digital_assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" 
ON public.digital_assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" 
ON public.digital_assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for digital-assets bucket
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'digital-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'digital-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'digital-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'digital-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_digital_assets_updated_at
BEFORE UPDATE ON public.digital_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();