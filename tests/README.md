# Testing Guide

This directory contains test scripts and checklists to verify the frontend implementation.

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

2. **Seed the database (if not already done):**
   ```bash
   npm run seed
   ```

3. **Choose your testing method:**

---

## Testing Methods

### 1. Manual Testing Checklist (Recommended for UI)

**File:** `frontend-test-checklist.md`

A comprehensive checklist covering all UI features:
- Login functionality
- Dashboard display
- Upload workflow
- Triage workflow
- Search functionality
- Metadata entry
- Accessibility & contrast
- Mobile responsiveness

**How to use:**
1. Open `tests/frontend-test-checklist.md`
2. Open the app in your browser: `http://localhost:3000`
3. Go through each test item and check the boxes
4. Document any issues found

**Best for:** Thorough UI/UX verification, visual checks, user experience testing

---

### 2. Browser Console Test (Quick Automated Checks)

**File:** `browser-console-test.js`

An automated script that runs in the browser console to check:
- Page elements exist
- Text contrast
- Button sizes
- CSS/JS loading
- Accessibility attributes

**How to use:**
1. Open the app in your browser: `http://localhost:3000`
2. Log in with test credentials
3. Open browser DevTools (F12)
4. Go to Console tab
5. Copy and paste the contents of `browser-console-test.js`
6. Press Enter
7. Review the test results

**Best for:** Quick verification, automated checks, development testing

---

### 3. Integration Test (API Endpoints)

**File:** `integration-test.js`

Tests the backend API endpoints:
- Health check
- Authentication
- Protected routes
- Workflow queues
- Search functionality

**How to use:**
```bash
# Make sure server is running first
npm start

# In another terminal:
node tests/integration-test.js
```

**Best for:** Backend API verification, CI/CD, automated testing

---

### 4. Route Testing Manual (API with curl)

**File:** `route-testing-manual.md`

Comprehensive curl commands for testing all API endpoints manually.

**How to use:**
1. Follow the instructions in `route-testing-manual.md`
2. Copy/paste curl commands into terminal
3. Verify responses

**Best for:** API debugging, manual endpoint testing, understanding API structure

---

## Test Credentials

After running `npm run seed`:

- **Admin**: `admin@example.com` / `admin123`
- **Editor**: `editor@example.com` / `editor123`
- **Viewer**: `viewer@example.com` / `viewer123`

---

## Recommended Testing Workflow

1. **Start with Integration Test** (quick API check)
   ```bash
   node tests/integration-test.js
   ```

2. **Run Browser Console Test** (quick UI check)
   - Open app → Login → Open console → Paste script

3. **Complete Manual Checklist** (thorough verification)
   - Go through `frontend-test-checklist.md` systematically

4. **Test on Multiple Devices**
   - Desktop browser
   - Mobile device (or browser DevTools mobile emulation)
   - Tablet (if available)

---

## What to Test

### Core Workflow (MVP)
- ✅ Login → Upload → Triage → Search
- ✅ All UI elements visible and readable
- ✅ No console errors
- ✅ Proper error handling
- ✅ Mobile responsiveness

### Accessibility
- ✅ Text contrast meets WCAG standards
- ✅ Touch targets are 44px minimum
- ✅ Keyboard navigation works
- ✅ Focus states are visible

### Error Handling
- ✅ Network errors show user-friendly messages
- ✅ Invalid inputs show appropriate errors
- ✅ Session expiration redirects to login

---

## Troubleshooting

### Tests fail to connect
- Ensure server is running: `npm start`
- Check server is on port 3000: `http://localhost:3000`

### Browser console test shows errors
- Check browser console for actual errors (red messages)
- Verify you're logged in
- Check network tab for failed API calls

### Integration test fails
- Verify database is seeded: `npm run seed`
- Check database connection in `.env`
- Ensure server is running

---

## Reporting Issues

When reporting test failures, include:
1. Which test method you used
2. Browser/device information
3. Console errors (if any)
4. Screenshots (for UI issues)
5. Steps to reproduce

---

## Next Steps

After verifying the core workflow:
- Test edge cases (large files, many photos, etc.)
- Test with different user roles
- Test performance with many photos
- Test backup/restore functionality (if implemented)
