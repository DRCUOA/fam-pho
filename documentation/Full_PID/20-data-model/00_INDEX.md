# Data Model — Index

**Purpose:** Describe the information architecture for *fam-pho* (entities, relationships, and metadata strategy) so features remain consistent and searchable.

## Read first
1. [er-narrative.md](er-narrative.md) — entity/relationship narrative and rationale

## What this folder covers
- Core entities (e.g., Photo, Person, Event, Location, Tag)
- Metadata capture rules (required vs optional, provenance, confidence/unknowns)
- Search/index strategy assumptions (e.g., FTS fields, facets)

## How to use it
- Before implementing database tables/migrations
- When adding new metadata fields or search facets
- When validating that workflow screens map cleanly to stored data

## Canonical source rule
This folder is the **source of truth** for stored data shape. If a UI idea conflicts with the model, either adjust the model deliberately or revise the UI expectation.
