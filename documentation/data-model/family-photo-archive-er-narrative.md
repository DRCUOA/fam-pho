# ER Data Model Narrative — Family Photo Archive (MVP + Growth)

This narrative defines a pragmatic entity–relationship model for a **Family Photo Archive** web app. The model supports the end-to-end workflow shown in the wireframes: **Upload → Triage/Review → Metadata Entry → Search/Detail**, while keeping a clean path for later enhancements (dedupe, quality scoring, renditions, geocoding, and richer access control).

---

## 1) Domain boundaries and tenancy

### Libraries (Family Groups)
A **Library** (also called a **Family Group**) is the primary tenancy boundary. Everything a family shares—photos, albums, people, tags—belongs to a library.

- A user can belong to multiple libraries
- All read/write operations are scoped by `library_id` membership and role

### Users and Membership
A **User** represents an authenticated account.

A **LibraryMember** record connects users to libraries and defines their permissions.

Typical roles:
- **Owner**: manage members, storage settings, destructive actions
- **Organizer**: approve/reject, edit metadata, manage albums/tags
- **Contributor**: upload, edit own uploads (optional), suggest metadata
- **Viewer**: view/search only

---

## 2) Photos as archive items, files as stored assets

### Photos (archive items)
A **Photo** is the archive item users organize and enrich. It belongs to a library and holds:

- Uploader reference and upload timestamp
- Current workflow state for queueing and filtering
- User-facing metadata (date taken, location text, description/notes)
- Soft-delete and moderation flags (rejected/flagged) without destroying history

### PhotoFiles / Assets (stored binaries)
A **PhotoFile** (or Asset) stores the **binary facts** and the storage reference:

- filename, byte size, mime type/format
- width/height, orientation/rotation
- storage key/path/URL (abstracted)
- checksum/hash (e.g., SHA-256) to support duplicate detection
- optional renditions (thumbnail/preview/original) as separate rows

This separation allows:
- multiple renditions per photo
- future support for video and non-image assets
- replacement/re-upload without losing metadata history

---

## 3) Metadata and organization

### People
A **Person** is scoped to a library and represents an individual that can be tagged in photos.

- name (required)
- optional relationship label (e.g., “Mom”, “Dad”, “Sarah”)
- optional aliases/notes

Photos and people are linked through `PhotoPerson` (many-to-many).

### Albums
An **Album** is a curated collection.

- name, description
- created_by, created_at

Photos and albums are linked through `PhotoAlbum` (many-to-many).

### Tags
A **Tag** is a lightweight classification label used for facets and filtering.

- name (unique per library)

Photos and tags are linked through `PhotoTag` (many-to-many).

### Locations
For MVP, location capture should remain low-friction:

- store **free-text** location on the photo (`Photo.location_text`)
- optionally also support structured locations:

A **Location** represents a reusable place, optionally with geocoding.
Photos and locations link via `PhotoLocation` (many-to-many).

This enables later:
- consistent place names across photos
- map views and proximity search (if desired)

---

## 4) Workflow and state management

### Current workflow state
Each photo has a `current_state` for fast queue retrieval and filtering.

Suggested states:
- `uploaded` — uploaded but not yet triaged
- `triage` — awaiting review/quality decisions
- `metadata_entry` — awaiting enrichment (date/people/location/notes)
- `complete` — ready for normal archive browsing/search

Exception/terminal states:
- `flagged` — needs attention, but retained
- `rejected` — excluded from normal views, but retained for audit

### Workflow history (immutable)
Every transition is recorded in `PhotoWorkflowEvent`:

- `from_state` → `to_state`
- `actor_user_id`
- timestamp
- optional reason/comment (e.g., “blurred”, “duplicate”, “wrong family”)

This provides:
- auditability
- analytics on throughput and bottlenecks
- ability to rebuild state if needed

---

## 5) Quality and duplicate detection

### Quality checks
Automated and manual checks are stored as `PhotoQualityCheck` records:

- `type`: `clarity`, `duplicate`, `orientation`, etc.
- `result`: pass/fail/unknown (+ optional confidence)
- `details_json`: algorithm version, score, matched IDs, notes
- timestamp

### Duplicate relationships
Duplicates are identified using hashes on original assets (e.g., SHA-256 stored on `PhotoFile`).

A duplicate linkage can be represented either as:
- a dedicated table `photo_duplicates(photo_id, duplicate_of_photo_id, confidence, created_at)`, or
- as structured data in `PhotoQualityCheck.details_json` for MVP

---

## 6) Search and retrieval

### Search capabilities
The system supports:

- keyword search across description/notes/location text
- filters: date range, people, album/tag, location
- pagination and sorting

### Indexing approach
For an MVP using SQLite:

- implement **FTS5** for keyword search
- maintain a search index that includes:
  - photo description/notes
  - location text
  - people names (denormalized into the index on change)
  - album/tag names (optional)

Triggers or application-layer updates keep the index in sync with metadata edits.

---

## 7) Activity and audit

### Activity log
An `ActivityLog` captures user actions at a consistent granularity:

- uploads, edits, approvals/rejections, metadata changes
- actor user_id
- target entity type/id
- timestamp
- optional `details_json` for event payloads

### Soft deletes and moderation semantics
To avoid data loss and preserve provenance:

- **Rejected**: excluded from normal archive views; still retrievable by privileged users
- **Flagged**: visible but highlighted for review or correction
- **Deleted**: if supported, should be restricted to owners and still leave an audit record

---

## 8) Storage and quota management

Storage is tracked based on the bytes recorded in `PhotoFile`.

Recommended primary accounting unit:
- **per Library** usage (shared family pool)

Optional attribution:
- per User usage (who consumed storage)

Plans/tier can be modeled either on `Library` or a separate `Plan` table later.

---

## 9) Conceptual relationships (cardinalities)

- **Library → Members**: 1-to-many
- **User → LibraryMember**: 1-to-many
- **Library → Photos**: 1-to-many
- **User → Photos (uploader)**: 1-to-many
- **Photo → PhotoFiles**: 1-to-many (or 1-to-1 in MVP)
- **Photo ↔ Person**: many-to-many (`PhotoPerson`)
- **Photo ↔ Album**: many-to-many (`PhotoAlbum`)
- **Photo ↔ Tag**: many-to-many (`PhotoTag`)
- **Photo ↔ Location**: many-to-many (`PhotoLocation`, optional in MVP)
- **Photo → QualityChecks**: 1-to-many
- **Photo → WorkflowEvents**: 1-to-many
- **Library/User → ActivityLog**: 1-to-many

---

## 10) Minimal conceptual table set (MVP-oriented)

### Identity & tenancy
- `users(id, email, password_hash, display_name, avatar_url, created_at, ...)`
- `libraries(id, name, created_by, quota_bytes, created_at, ...)`
- `library_members(id, library_id, user_id, role, status, joined_at, ...)`

### Photos & assets
- `photos(id, library_id, uploaded_by, upload_at, current_state, date_taken, location_text, description, is_flagged, is_rejected, deleted_at, ...)`
- `photo_files(id, photo_id, kind, storage_key, mime_type, bytes, width, height, orientation, sha256, created_at, ...)`
  - `kind`: `original` | `preview` | `thumbnail`

### People / albums / tags
- `people(id, library_id, name, relationship_label, created_at, ...)`
- `photo_people(photo_id, person_id, tagged_by, tagged_at, ...)`

- `albums(id, library_id, name, description, created_by, created_at, ...)`
- `photo_albums(photo_id, album_id, added_by, added_at, ...)`

- `tags(id, library_id, name, created_at, ...)`
- `photo_tags(photo_id, tag_id, added_by, added_at, ...)`

### Workflow / quality / audit
- `photo_workflow_events(id, photo_id, from_state, to_state, actor_user_id, reason, created_at)`
- `photo_quality_checks(id, photo_id, type, result, details_json, created_at)`
- `activity_log(id, library_id, actor_user_id, action, entity_type, entity_id, details_json, created_at)`

---

## 11) MVP cut line (recommended)

**MVP**
- Users, Libraries, Membership
- Photos with current_state
- Single PhotoFile per photo (`original`)
- People tagging + albums (or tags; choose one initially)
- WorkflowEvents and ActivityLog
- Basic search: keyword + date range + people + location text

**Later**
- Multiple renditions (preview/thumbnail)
- Structured Locations + geocoding
- Face regions + recognition
- Advanced dedupe merge tooling
- Tiered plans/billing and richer storage accounting

---

## 12) Notes on alignment with the wireframe workflow

- **Triage Queue** is driven by `photos.current_state = 'triage'` (and optionally `is_flagged`)
- **Metadata Entry** is driven by `photos.current_state = 'metadata_entry'`
- **Photo Detail** reads `photos` + joins to people/albums/tags/locations plus workflow history
- **Search** combines FTS keyword matching with joins/filters on relationships

This narrative yields a database model that is simple enough for MVP implementation, but structured to avoid painful rewrites as features expand.
