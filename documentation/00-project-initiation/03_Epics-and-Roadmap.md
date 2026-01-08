Below is the **EPIC-level breakdown** for the fam-pho App.  This is intentionally **high-level (EPIC only)** — no implementation detail - intended to set clean scope boundaries.

## EPIC 1 — Secure Access & Identity

**Goal:**
Ensure only authorised users can access and operate the system safely over a public URL.

**Scope:**

* User authentication
* Authorisation and roles
* Session management
* Security controls

**Success Criteria:**

* Only authenticated users can access the system
* Roles enforce permissions correctly
* No sensitive data exposed to unauthorised parties

---

## EPIC 2 — Device Upload & Ingestion

**Goal:**
Enable reliable, high-quality photo ingestion from mobile and desktop devices.

**Scope:**

* Upload UX (mobile + desktop)
* Upload validation and hashing
* Staging area (`_incoming`)
* Duplicate detection

**Success Criteria:**

* Users can upload from phone or desktop
* Duplicate images are detected and flagged
* Raw uploads never pollute the archive

---

## EPIC 3 — Triage & Curation Workflow

**Goal:**
Allow users to review, accept, discard, and manage incoming photos before archival.

**Scope:**

* Triage queue UI
* Keep/discard/duplicate decisions
* Undo and recovery flows

**Success Criteria:**

* No image enters the archive without triage
* Discards are reversible for a defined period

---

## EPIC 4 — Archival & File Management

**Goal:**
Preserve master files safely while enabling derivative processing.

**Scope:**

* Master file storage
* Derivative generation
* File relationships
* Non-destructive rules

**Success Criteria:**

* Master files are immutable
* Derivatives are tracked and linked
* File corruption or overwrite is impossible

---

## EPIC 5 — Metadata & Catalog

**Goal:**
Create a rich, structured, human-meaningful catalog of the archive.

**Scope:**

* Metadata schema
* Metadata editing UI
* Bulk edits
* EXIF/XMP syncing
* Audit trail

**Success Criteria:**

* Every archived photo has structured metadata
* Metadata is queryable, editable, and versioned

---

## EPIC 6 — Search & Retrieval

**Goal:**
Enable fast, flexible retrieval of photos by meaning, not just filenames.

**Scope:**

* Full-text search
* Filters (people, date, event, etc.)
* Combined queries
* Export

**Success Criteria:**

* Users can find any photo in seconds
* Search works across all metadata dimensions

---

## EPIC 7 — Assisted Enrichment (Optional Intelligence)

**Goal:**
Support optional AI assistance without compromising privacy or control.

**Scope:**

* Face detection
* Content suggestions
* Human-in-the-loop confirmation

**Success Criteria:**

* Assistance is opt-in
* No auto-labeling without human confirmation
* No third-party leakage

---

## EPIC 8 — Workflow Guidance & State Management

**Goal:**
Make the system actively guide the user through what needs doing next.

**Scope:**

* Workflow state model
* Task queues
* Progress visibility

**Success Criteria:**

* User always knows what needs attention
* No “lost” or forgotten photos

---

## EPIC 9 — Backup, Recovery & Integrity

**Goal:**
Protect the archive against data loss, corruption, or human error.

**Scope:**

* Scheduled backups
* Restore tools
* Encryption
* Integrity checks

**Success Criteria:**

* Recovery is possible after any failure
* No silent corruption

---

## EPIC 10 — Deployment, Operations & Observability

**Goal:**
Ensure the system is stable, deployable, monitorable, and maintainable.

**Scope:**

* Environment config
* Logging
* Error tracking
* Health checks

**Success Criteria:**

* Admin can deploy, monitor, and troubleshoot confidently

---

## EPIC 11 — Privacy, Ethics & Governance

**Goal:**
Respect the personal and sensitive nature of family photo data.

**Scope:**

* Privacy defaults
* Access logging
* Explicit sharing controls

**Success Criteria:**

* Nothing is public by accident
* Access is accountable and auditable

---

### Relationship Summary

```
Secure Access underpins everything.
Upload → Triage → Archive → Enrich → Search → Backup is the core lifecycle.
Ops + Privacy wrap the system.
```