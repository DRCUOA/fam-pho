
# Fam-pho (Photo Archive Web App) — Requirements

---

## 1. Authentication & Security

1.1 The app **must be accessible via a public HTTPS URL**.

1.2 The app **must require authentication for all non-login routes**.

1.3 The app **must support email + password login**.

1.4 Passwords **must be stored hashed using Argon2 or bcrypt**.

1.5 The app **must support role-based access control (RBAC)** with at least:

* `admin`
* `editor`
* `viewer`

1.6 The app **must enforce authorization on all API routes**.

1.7 The app **must support session-based authentication** (secure cookies) or JWT with refresh tokens.

1.8 The app **must implement CSRF protection** for form-based requests.

1.9 The app **must enforce rate limiting on login endpoints**.

1.10 The app **must support optional 2FA (TOTP)** for admin users.

---

## 2. Device & Access

2.1 The app **must be responsive** and usable on:

* Mobile (S24 Ultra)
* Desktop (macOS browser)

2.2 The app **must support camera-based image upload from mobile browsers**.

2.3 The app **must support drag-and-drop batch upload from desktop**.

2.4 The app **must support resumable uploads** (for poor mobile connectivity).

---

## 3. Upload & Ingestion

3.1 The app **must support uploading high-resolution image files** (JPG, TIFF, PNG).

3.2 The app **must accept uploads into a staging area** (`_incoming`).

3.3 The app **must compute and store a SHA256 hash per image** for duplicate detection.

3.4 The app **must prevent duplicate ingestion based on hash**.

3.5 The app **must record original filename, upload date, and uploader**.

---

## 4. Triage & Curation

4.1 The app **must present a triage queue UI** showing newly uploaded images.

4.2 The app **must support marking each image as:**

* keep
* discard
* duplicate

4.3 The app **must prevent discarded images from entering the main archive**.

4.4 The app **must allow reversing a discard before permanent deletion**.

---

## 5. File Management

5.1 The app **must store original files unchanged** in a master directory.

5.2 The app **must support generating derivative versions** (cropped, rotated, colour-corrected).

5.3 The app **must track relationships between master and derivatives**.

5.4 The app **must never overwrite master files**.

---

## 6. Metadata & Catalog

6.1 The app **must maintain a SQLite database** containing:

* filename
* hash
* date_taken
* event
* location
* people
* notes
* tags
* quality_rating

6.2 The app **must support editing metadata through a form UI**.

6.3 The app **must support bulk metadata edits**.

6.4 The app **must write key metadata back into EXIF/XMP fields**.

6.5 The app **must version metadata changes** (audit trail).

---

## 7. Search & Retrieval

7.1 The app **must support full-text search across metadata fields**.

7.2 The app **must support filters for:**

* people
* date range
* event
* location
* rating
* tags

7.3 The app **must support combined filter + text queries**.

7.4 The app **must support result export (ZIP or CSV)**.

---

## 8. Face & Content Assistance (Optional)

8.1 The app **may integrate local face recognition assistance** (not auto-label).

8.2 The app **must require human confirmation before saving face tags**.

8.3 The app **must not send images to third-party AI services without explicit opt-in**.

---

## 9. Workflow Support

9.1 The app **must visually represent workflow states:**

* incoming
* triaged
* archived
* enriched

9.2 The app **must support a “next task” queue** (what needs tagging, what needs review).

9.3 The app **must support marking items as “complete”**.

---

## 10. Backup & Data Integrity

10.1 The app **must support scheduled backup of:**

* SQLite DB
* image directories

10.2 Backups **must be encrypted at rest**.

10.3 The app **must support restore-from-backup**.

10.4 The app **must log backup success/failure**.

---

## 11. Deployment & Ops

11.1 The app **must run on your existing Node + Express + SQLite stack**.

11.2 The app **must be deployable behind Nginx or Caddy with HTTPS**.

11.3 The app **must support environment-based configuration**.

11.4 The app **must log auth, errors, and data mutations**.

---

## 12. Non-Functional Requirements

12.1 The system **must handle at least 10k images without noticeable degradation**.

12.2 All destructive actions **must be reversible for at least 30 days**.

12.3 The app **must not rely on proprietary cloud services**.

12.4 The system **must be self-hostable**.

12.5 The system **must maintain human legibility over automation convenience**.

---

## 13. Privacy & Ethics

13.1 The system **must treat all images as private by default**.

13.2 The system **must not expose any image publicly without explicit action**.

13.3 The system **must log all access to images**.