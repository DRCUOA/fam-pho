-- Development seed data
-- WARNING: This file contains test credentials. DO NOT use in production.

-- Insert test users
INSERT OR IGNORE INTO users (id, email, password_hash, display_name, is_active) VALUES
(1, 'admin@example.com', '$argon2id$v=19$m=65536,t=3,p=4$dummy_hash_placeholder', 'Admin User', 1),
(2, 'editor@example.com', '$argon2id$v=19$m=65536,t=3,p=4$dummy_hash_placeholder', 'Editor User', 1),
(3, 'viewer@example.com', '$argon2id$v=19$m=65536,t=3,p=4$dummy_hash_placeholder', 'Viewer User', 1);

-- Insert test library
INSERT OR IGNORE INTO libraries (id, name, created_by) VALUES
(1, 'Family Archive', 1);

-- Insert library members
INSERT OR IGNORE INTO library_members (library_id, user_id, role, status) VALUES
(1, 1, 'owner', 'active'),
(1, 2, 'organizer', 'active'),
(1, 3, 'viewer', 'active');
