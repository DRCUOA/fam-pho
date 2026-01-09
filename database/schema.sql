-- Family Photo Archive Database Schema (PostgreSQL)
-- Based on ER narrative from documentation/Full_PID/20-data-model/

-- Enable UUID extension (optional, but useful for future)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Identity & Tenancy
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS libraries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL,
    quota_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS library_members (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL CHECK(role IN ('owner', 'organizer', 'contributor', 'viewer')),
    status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'invited', 'suspended')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(library_id, user_id)
);

-- Photos & Assets
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    upload_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_state VARCHAR(50) NOT NULL DEFAULT 'uploaded' 
        CHECK(current_state IN ('uploaded', 'triage', 'metadata_entry', 'complete', 'flagged', 'rejected')),
    date_taken TIMESTAMP,
    location_text TEXT,
    description TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_rejected BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    search_vector tsvector,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS photo_files (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    kind VARCHAR(50) NOT NULL CHECK(kind IN ('original', 'preview', 'thumbnail', 'derivative')),
    storage_key TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    orientation INTEGER DEFAULT 1,
    sha256 VARCHAR(64) NOT NULL,
    metadata_json JSONB,
    parent_file_id INTEGER,
    derivative_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_file_id) REFERENCES photo_files(id) ON DELETE CASCADE
);

-- People / Albums / Tags
CREATE TABLE IF NOT EXISTS people (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship_label VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    UNIQUE(library_id, name)
);

CREATE TABLE IF NOT EXISTS photo_people (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    tagged_by INTEGER NOT NULL,
    tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
    FOREIGN KEY (tagged_by) REFERENCES users(id),
    UNIQUE(photo_id, person_id)
);

CREATE TABLE IF NOT EXISTS albums (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(library_id, name)
);

CREATE TABLE IF NOT EXISTS photo_albums (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id),
    UNIQUE(photo_id, album_id)
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    library_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    UNIQUE(library_id, name)
);

CREATE TABLE IF NOT EXISTS photo_tags (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id),
    UNIQUE(photo_id, tag_id)
);

-- Workflow / Quality / Audit
CREATE TABLE IF NOT EXISTS photo_workflow_events (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    actor_user_id INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS photo_quality_checks (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK(type IN ('clarity', 'duplicate', 'orientation', 'other')),
    result VARCHAR(50) NOT NULL CHECK(result IN ('pass', 'fail', 'unknown')),
    confidence REAL,
    details_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    library_id INTEGER,
    actor_user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    details_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE SET NULL,
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_library_id ON photos(library_id);
CREATE INDEX IF NOT EXISTS idx_photos_current_state ON photos(current_state);
CREATE INDEX IF NOT EXISTS idx_photos_date_taken ON photos(date_taken);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photo_files_photo_id ON photo_files(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_files_sha256 ON photo_files(sha256);
CREATE INDEX IF NOT EXISTS idx_photo_people_photo_id ON photo_people(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_people_person_id ON photo_people(person_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_photo_id ON photo_albums(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_album_id ON photo_albums(album_id);
CREATE INDEX IF NOT EXISTS idx_library_members_library_id ON library_members(library_id);
CREATE INDEX IF NOT EXISTS idx_library_members_user_id ON library_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_library_id ON activity_log(library_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_user_id ON activity_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_workflow_events_photo_id ON photo_workflow_events(photo_id);

-- Full-text search index (GIN index on tsvector)
CREATE INDEX IF NOT EXISTS idx_photos_search_vector ON photos USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_photo_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.location_text, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE((
            SELECT string_agg(p.name, ' ')
            FROM photo_people pp
            JOIN people p ON pp.person_id = p.id
            WHERE pp.photo_id = NEW.id
        ), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE((
            SELECT string_agg(t.name, ' ')
            FROM photo_tags pt
            JOIN tags t ON pt.tag_id = t.id
            WHERE pt.photo_id = NEW.id
        ), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on photo insert/update
CREATE TRIGGER photos_search_vector_update
    BEFORE INSERT OR UPDATE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_search_vector();

-- Function to update search vector when people/tags change
CREATE OR REPLACE FUNCTION update_photo_search_on_relation_change() RETURNS TRIGGER AS $$
BEGIN
    UPDATE photos SET search_vector = 
        setweight(to_tsvector('english', COALESCE(description, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(location_text, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE((
            SELECT string_agg(p.name, ' ')
            FROM photo_people pp
            JOIN people p ON pp.person_id = p.id
            WHERE pp.photo_id = COALESCE(NEW.photo_id, OLD.photo_id)
        ), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE((
            SELECT string_agg(t.name, ' ')
            FROM photo_tags pt
            JOIN tags t ON pt.tag_id = t.id
            WHERE pt.photo_id = COALESCE(NEW.photo_id, OLD.photo_id)
        ), '')), 'C')
    WHERE id = COALESCE(NEW.photo_id, OLD.photo_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update search vector when people/tags change
CREATE TRIGGER photos_search_vector_update_people_insert
    AFTER INSERT ON photo_people
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_search_on_relation_change();

CREATE TRIGGER photos_search_vector_update_people_delete
    AFTER DELETE ON photo_people
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_search_on_relation_change();

CREATE TRIGGER photos_search_vector_update_tags_insert
    AFTER INSERT ON photo_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_search_on_relation_change();

CREATE TRIGGER photos_search_vector_update_tags_delete
    AFTER DELETE ON photo_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_search_on_relation_change();
