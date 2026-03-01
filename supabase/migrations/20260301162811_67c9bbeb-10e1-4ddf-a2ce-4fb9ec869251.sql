INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('proposals', 'proposals', false, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow uploads to proposals" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'proposals');

CREATE POLICY "Allow reading proposals" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'proposals');

CREATE POLICY "Allow deleting proposals" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id = 'proposals');