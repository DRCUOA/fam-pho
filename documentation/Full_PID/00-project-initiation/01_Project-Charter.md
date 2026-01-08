1. **Build a self-hosted “Family Photo Archive” web app** that lets you digitise and manage a large family collection with high-quality outcomes (quality > speed), accessible on both phone (S24 Ultra) and your Mac. 
2. **Core lifecycle is explicit and guided:** **Upload → Triage/Review → Metadata Entry/Enrichment → Search/Detail** (with “next task” guidance so nothing gets lost).
3. **Security-first, private-by-default:** public HTTPS URL, authentication required, RBAC roles (admin/editor/viewer), secure password hashing, and authorization on every API route. 
4. **Mobile + desktop ingestion is a first-class goal:** camera-based upload on mobile, drag-and-drop batch upload on desktop, plus resumable uploads for unreliable connectivity. 
5. **Ingestion is controlled and reversible:** uploads land in a staging area (`_incoming`), then each item is triaged as **keep / discard / duplicate**, with undo before permanent deletion.
6. **Duplicate detection and integrity are foundational:** compute/store **SHA-256 per image**, prevent duplicate ingestion, and preserve originals unchanged.
7. **Non-destructive archive principles:** originals (“masters”) are immutable; derivatives (rotate/crop/colour-correct) are tracked as linked assets, never overwriting the master.
8. **Metadata is the “meaning layer”:** store structured fields (date taken, event/location, people, tags, notes, quality rating), support bulk edits, version metadata changes, and write key metadata back to EXIF/XMP.
9. **Fast retrieval by meaning, not filenames:** full-text search (SQLite FTS5) + filters (people/date/event/location/tags/rating), combined queries, and export (ZIP/CSV).
10. **Designed to scale and last:** handle ~10k images smoothly, keep destructive actions reversible for 30 days, maintain audit/activity logs and workflow history, and support encrypted backups + restore.
