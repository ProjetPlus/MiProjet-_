-- Create news-media storage bucket for news images and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-media', 
  'news-media', 
  true, 
  524288000,  -- 500MB for videos
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to news-media
CREATE POLICY "Public can view news media" ON storage.objects
FOR SELECT USING (bucket_id = 'news-media');

-- Allow admins to upload news media
CREATE POLICY "Admins can upload news media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'news-media' 
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete news media
CREATE POLICY "Admins can delete news media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'news-media' 
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);