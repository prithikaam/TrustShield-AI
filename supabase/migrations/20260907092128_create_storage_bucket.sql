/*
# Create profile-images storage bucket

Creates a public storage bucket for profile image uploads.
Images are readable by anyone (needed for display) but only
authenticated users can upload to their own folder path.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "auth_upload_profile_images" ON storage.objects;
CREATE POLICY "auth_upload_profile_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read
DROP POLICY IF EXISTS "public_read_profile_images" ON storage.objects;
CREATE POLICY "public_read_profile_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-images');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "auth_delete_profile_images" ON storage.objects;
CREATE POLICY "auth_delete_profile_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
