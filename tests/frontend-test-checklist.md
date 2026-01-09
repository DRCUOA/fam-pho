# Frontend Implementation Test Checklist

This document provides a comprehensive test checklist to verify the frontend implementation is working correctly.

## Prerequisites

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

3. **Test Credentials:**
   - **Admin**: `admin@example.com` / `admin123`
   - **Editor**: `editor@example.com` / `editor123`
   - **Viewer**: `viewer@example.com` / `viewer123`

4. **Base URL:** `http://localhost:3000`

5. **Open browser DevTools** (F12) to check console for errors

---

## Test 1: Login Page

### 1.1 Visual Checks
- [ ] Page loads at `http://localhost:3000`
- [ ] "Family Photo Archive" heading is visible and readable
- [ ] Login form is centered on page
- [ ] Email and Password labels are clearly visible (dark text, not light gray)
- [ ] Input fields are visible and functional
- [ ] Login button is visible and has dark background with white text

### 1.2 Functionality
- [ ] Enter email: `admin@example.com`
- [ ] Enter password: `admin123`
- [ ] Click "Login" button
- [ ] Page redirects to dashboard (no errors in console)
- [ ] Session is maintained (refresh page, should stay logged in)

### 1.3 Error Handling
- [ ] Try invalid credentials (wrong email/password)
- [ ] Error message appears (red notification at top)
- [ ] Error message is readable (white text on red background)
- [ ] Error message auto-dismisses after 5 seconds

---

## Test 2: Dashboard

### 2.1 Visual Checks
- [ ] Header shows "Family Archive" title
- [ ] Logout button (sign-out icon) is visible in header
- [ ] Workflow Status card is visible with blue gradient background
- [ ] Current Stage text is readable (dark text)
- [ ] Progress bar is visible
- [ ] "Next Tasks" section is visible
- [ ] Quick Actions buttons are visible:
  - [ ] Upload Photos (dark button)
  - [ ] Review Queue (white button with border)
  - [ ] Metadata Entry (white button with border)
  - [ ] Search Archive (white button with border)
- [ ] All text is readable (no white text on white background)
- [ ] Secondary text (like "0 photos waiting") is visible (not too light)

### 2.2 Functionality
- [ ] Click "Upload Photos" button → navigates to upload page
- [ ] Click "Review Queue" button → navigates to triage page
- [ ] Click "Search Archive" button → navigates to search page
- [ ] Click logout button → redirects to login page
- [ ] Workflow status updates dynamically (if photos exist)

### 2.3 Responsive Design
- [ ] Resize browser window to mobile size (375px width)
- [ ] All elements remain visible and readable
- [ ] Buttons are at least 44px tall (touch-friendly)
- [ ] Text doesn't overflow or get cut off

---

## Test 3: Upload Page

### 3.1 Visual Checks
- [ ] Back button (arrow left) is visible in header
- [ ] "Upload Photos" title is visible
- [ ] Upload zone is visible with dashed border
- [ ] Cloud upload icon is visible (not too light)
- [ ] "Drag and drop photos here" text is readable
- [ ] "Select Files" button is visible (dark background)
- [ ] "Take Photo" button is visible (dark gray background)
- [ ] All text is readable (no contrast issues)

### 3.2 Drag and Drop
- [ ] Drag image files over upload zone
- [ ] Upload zone highlights (border changes, background changes)
- [ ] Drop files on upload zone
- [ ] File preview list appears below upload zone
- [ ] Each file shows thumbnail, filename, and size
- [ ] File size text is readable (not too light)

### 3.3 File Selection
- [ ] Click "Select Files" button
- [ ] File picker opens
- [ ] Select multiple image files
- [ ] File preview list appears
- [ ] Each file has a remove button (X icon)

### 3.4 Camera Capture (Mobile)
- [ ] On mobile device, click "Take Photo" button
- [ ] Camera interface opens
- [ ] Take a photo
- [ ] Photo appears in file preview list

### 3.5 Upload Process
- [ ] Select files (or use drag-and-drop)
- [ ] Click "Upload Selected Files" button (green button appears)
- [ ] Progress bar appears and shows upload progress
- [ ] "Uploading..." text is visible
- [ ] After upload completes, success message appears
- [ ] Files are cleared from preview list

### 3.6 Error Handling
- [ ] Try uploading non-image file (if possible)
- [ ] Error message appears
- [ ] Try uploading very large file
- [ ] Appropriate error handling occurs

---

## Test 4: Triage Page

### 4.1 Visual Checks
- [ ] Back button is visible in header
- [ ] "Review Queue" title is visible
- [ ] Grid view toggle button is visible (if photos exist)
- [ ] Loading spinner appears while loading
- [ ] "Loading photos..." text is readable

### 4.2 Empty State
- [ ] If no photos in queue, empty state appears
- [ ] Green checkmark icon is visible
- [ ] "All caught up!" message is visible
- [ ] Text is readable (dark text)

### 4.3 Photo Display (Single View)
- [ ] If photos exist, single photo view appears
- [ ] Photo is displayed large and centered
- [ ] Photo filename is visible
- [ ] Upload date is visible
- [ ] Action buttons are visible:
  - [ ] Keep (green button)
  - [ ] Discard (red button)
  - [ ] Duplicate (yellow button)
- [ ] Navigation buttons are visible:
  - [ ] Previous (left arrow)
  - [ ] Next (right arrow)
- [ ] Keyboard shortcuts hint is visible at bottom

### 4.4 Photo Navigation
- [ ] Click "Next" button → next photo appears
- [ ] Click "Previous" button → previous photo appears
- [ ] Use keyboard arrow keys (← →) → navigation works
- [ ] First photo: Previous button is disabled
- [ ] Last photo: Next button is disabled

### 4.5 Grid View
- [ ] Click grid view toggle button
- [ ] Photos display in grid layout
- [ ] Click a photo in grid → switches to single view
- [ ] Grid view shows thumbnails

### 4.6 Triage Actions
- [ ] Click "Keep" button → photo is marked as kept
- [ ] Click "Discard" button → photo is marked as discarded
- [ ] Click "Duplicate" button → photo is marked as duplicate
- [ ] Use keyboard shortcuts:
  - [ ] Press 'K' → marks as keep
  - [ ] Press 'D' → marks as discard
  - [ ] Press 'U' → marks as duplicate
- [ ] After action, next photo appears automatically

---

## Test 5: Metadata Entry Page

### 5.1 Visual Checks
- [ ] Back button is visible in header
- [ ] "Metadata Entry" title is visible
- [ ] Photo preview is visible (left side on desktop, top on mobile)
- [ ] EXIF data panel is visible (right side on desktop, below photo on mobile)
- [ ] Metadata form is visible with fields:
  - [ ] Date Taken
  - [ ] Location
  - [ ] Description
  - [ ] People (with add/remove buttons)
  - [ ] Tags (with add/remove buttons)
- [ ] All labels are readable (dark text)
- [ ] Input fields are visible and functional

### 5.2 EXIF Data Display
- [ ] EXIF data loads and displays (if available)
- [ ] EXIF labels are readable (not too light)
- [ ] "No EXIF data available" message appears if no EXIF (readable text)

### 5.3 Form Functionality
- [ ] Date picker works for "Date Taken"
- [ ] Location input accepts text
- [ ] Description textarea accepts multi-line text
- [ ] Add person: enter name, click add → person appears in list
- [ ] Remove person: click X button → person is removed
- [ ] Add tag: enter tag, click add → tag appears in list
- [ ] Remove tag: click X button → tag is removed

### 5.4 Save Functionality
- [ ] Fill in metadata fields
- [ ] Click "Save Metadata" button
- [ ] Success message appears
- [ ] Data persists (refresh page, data is still there)

---

## Test 6: Search Page

### 6.1 Visual Checks
- [ ] Back button is visible in header
- [ ] "Search Archive" title is visible
- [ ] Filter button is visible in header
- [ ] Search input field is visible
- [ ] Search button (magnifying glass) is visible
- [ ] All text is readable

### 6.2 Search Functionality
- [ ] Type search query in input field
- [ ] Click search button or press Enter
- [ ] Loading spinner appears
- [ ] Search results appear in grid layout
- [ ] Results show photo thumbnails
- [ ] Results show filename and date
- [ ] Empty state appears if no results (icon and message visible)

### 6.3 Filters
- [ ] Click filter button → filter panel expands
- [ ] Date From and Date To inputs are visible
- [ ] "Apply Filters" button is visible
- [ ] "Clear Filters" button is visible
- [ ] Set date range and apply → results filter correctly
- [ ] Clear filters → all results return

### 6.4 Pagination
- [ ] If many results, pagination controls appear
- [ ] Page numbers are clickable
- [ ] Current page is highlighted (dark background)
- [ ] Click page number → results update

### 6.5 Search Results
- [ ] Click a photo in results → navigates to metadata page
- [ ] Photo thumbnails load correctly
- [ ] Placeholder icon appears if image fails to load (readable icon)

---

## Test 7: Accessibility & Contrast

### 7.1 Text Contrast
- [ ] All text on white/light backgrounds is dark and readable
- [ ] No white or very light gray text on white backgrounds
- [ ] Secondary text (like "0 photos waiting") is visible
- [ ] Icons are visible (not too light)

### 7.2 Focus States
- [ ] Tab through form fields → focus outline appears
- [ ] Focus outline is visible (dark outline)
- [ ] Keyboard navigation works throughout

### 7.3 Touch Targets
- [ ] All buttons are at least 44px tall on mobile
- [ ] All clickable elements are easily tappable
- [ ] No elements are too small to tap

---

## Test 8: Error Handling & Notifications

### 8.1 Loading States
- [ ] Loading spinner appears during API calls
- [ ] Loading text is visible and readable
- [ ] Loading states clear after operation completes

### 8.2 Success Messages
- [ ] Success notifications appear (green background, white text)
- [ ] Success messages are readable
- [ ] Success messages auto-dismiss after 3 seconds

### 8.3 Error Messages
- [ ] Error notifications appear (red background, white text)
- [ ] Error messages are readable
- [ ] Error messages auto-dismiss after 5 seconds
- [ ] Error messages can be manually dismissed (X button)

### 8.4 Network Errors
- [ ] Stop server → try to perform action
- [ ] Appropriate error message appears
- [ ] Error message is user-friendly (not technical)

---

## Test 9: Session Management

### 9.1 Session Expiration
- [ ] Log in successfully
- [ ] Wait for session to expire (or manually expire in backend)
- [ ] Try to perform action → redirects to login page
- [ ] Appropriate message appears

### 9.2 Logout
- [ ] Click logout button
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout
- [ ] Session cookie is cleared

---

## Test 10: Mobile Responsiveness

### 10.1 Mobile Viewport (375px)
- [ ] All pages are usable on mobile
- [ ] Text doesn't overflow
- [ ] Buttons are touch-friendly (44px minimum)
- [ ] Forms are usable
- [ ] Navigation works smoothly

### 10.2 Tablet Viewport (768px)
- [ ] Layout adapts appropriately
- [ ] Grid layouts adjust column count
- [ ] Side-by-side layouts (like metadata page) stack vertically

### 10.3 Desktop Viewport (1920px)
- [ ] Content doesn't stretch too wide
- [ ] Maximum width constraints work
- [ ] Layout is comfortable to use

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________
**Browser:** _______________
**Device:** _______________

**Total Tests:** 100+
**Passed:** _______
**Failed:** _______
**Notes:** _______________

---

## Known Issues / Notes

_Use this section to document any issues found during testing:_

1. 
2. 
3. 

---

## Quick Test Commands

### Check Console for Errors
Open browser DevTools (F12) → Console tab → Look for red errors

### Test API Endpoints
See `tests/route-testing-manual.md` for curl commands

### Verify Database State
```bash
psql -d fam_pho -c "SELECT COUNT(*) FROM photos;"
psql -d fam_pho -c "SELECT COUNT(*) FROM photos WHERE workflow_state = 'triage';"
```
