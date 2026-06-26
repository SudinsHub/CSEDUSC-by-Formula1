-- Migration: Add banner image and registration fee to events
SET search_path TO content, public;

ALTER TABLE content.events 
ADD COLUMN IF NOT EXISTS banner_image_id INTEGER,
ADD COLUMN IF NOT EXISTS registration_fee NUMERIC(10, 2) DEFAULT 0.00 CHECK (registration_fee >= 0);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_events_banner_image'
    ) THEN
        ALTER TABLE content.events 
        ADD CONSTRAINT fk_events_banner_image 
        FOREIGN KEY (banner_image_id) 
        REFERENCES content.media(media_id) 
        ON DELETE SET NULL;
    END IF;
END $$;
