-- Migration: Create gallery table and link media
SET search_path TO content, public;

CREATE TABLE IF NOT EXISTS gallery (
    gallery_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL, -- Reference to auth.users.user_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for gallery
CREATE INDEX IF NOT EXISTS idx_gallery_created_by ON gallery(created_by);

-- Alter media table to link to gallery
ALTER TABLE content.media
ADD COLUMN IF NOT EXISTS gallery_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_media_gallery'
    ) THEN
        ALTER TABLE content.media 
        ADD CONSTRAINT fk_media_gallery 
        FOREIGN KEY (gallery_id) 
        REFERENCES content.gallery(gallery_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_gallery ON media(gallery_id);

COMMENT ON TABLE gallery IS 'Club photo and media gallery entries';
