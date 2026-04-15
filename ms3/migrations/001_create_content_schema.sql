-- MS3 Content Schema Migration
-- Creates tables for events, notices, and media

-- ══════════════════════════════════════════════════════════════════════════════
-- EVENTS TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content.events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(300) NOT NULL,
    volunteers_needed INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    created_by INTEGER NOT NULL, -- Cross-schema reference to auth.users.user_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_status ON content.events(status);
CREATE INDEX idx_events_date ON content.events(event_date);
CREATE INDEX idx_events_created_by ON content.events(created_by);

-- ══════════════════════════════════════════════════════════════════════════════
-- EVENT REGISTRATIONS TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content.event_registrations (
    registration_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES content.events(event_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL, -- Cross-schema reference to auth.users.user_id
    type VARCHAR(20) NOT NULL CHECK (type IN ('attendee', 'volunteer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id) -- One registration per user per event
);

CREATE INDEX idx_event_registrations_event ON content.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON content.event_registrations(user_id);
CREATE INDEX idx_event_registrations_type ON content.event_registrations(type);
CREATE INDEX idx_event_registrations_status ON content.event_registrations(status);

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTICES TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content.notices (
    notice_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    expiry_date DATE, -- Nullable; expired notices hidden from public board
    created_by INTEGER NOT NULL, -- Cross-schema reference to auth.users.user_id
    published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_priority ON content.notices(priority);
CREATE INDEX idx_notices_expiry ON content.notices(expiry_date);
CREATE INDEX idx_notices_created_by ON content.notices(created_by);

-- ══════════════════════════════════════════════════════════════════════════════
-- MEDIA TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content.media (
    media_id SERIAL PRIMARY KEY,
    file_path TEXT NOT NULL, -- Relative path: YYYY/MM/uuid.ext
    file_type VARCHAR(50) NOT NULL, -- MIME type
    event_id INTEGER REFERENCES content.events(event_id) ON DELETE SET NULL,
    notice_id INTEGER REFERENCES content.notices(notice_id) ON DELETE SET NULL,
    uploaded_by INTEGER NOT NULL, -- Cross-schema reference to auth.users.user_id
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_event ON content.media(event_id);
CREATE INDEX idx_media_notice ON content.media(notice_id);
CREATE INDEX idx_media_uploaded_by ON content.media(uploaded_by);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE content.events IS 'Club events with registration and volunteer management';
COMMENT ON TABLE content.event_registrations IS 'Tracks attendee and volunteer registrations for events';
COMMENT ON TABLE content.notices IS 'Public notice board with priority and expiry';
COMMENT ON TABLE content.media IS 'Media files (images, videos, PDFs) linked to events or notices';
