-- Add contact_no and profile_picture to users table in auth schema
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS contact_no VARCHAR(50);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);

-- Allow uploaded_by in content.media to be NULL for public uploads (e.g. before registration)
ALTER TABLE content.media ALTER COLUMN uploaded_by DROP NOT NULL;
