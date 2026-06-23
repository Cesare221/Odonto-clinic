# Public Reschedule Month Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow patients using the public confirmation link to move between months when choosing a reschedule slot.

**Architecture:** The backend exposes a longer public reschedule window, while the frontend groups the already-fetched slots into month pages. Calendar helpers own date math and labels so the React page stays focused on state and interaction.

**Tech Stack:** React, Vite, Tailwind CSS, Express, Node test runner.

---

### Task 1: Expand Public Slot Window

**Files:**
- Modify: `backend/controllers/appointmentController.js`
- Test: `tests/appointment-confirmation-page.test.js`

- [ ] Change `PUBLIC_SLOT_WINDOW_DAYS` from `14` to `90` so public links can offer roughly three months of available slots.
- [ ] Keep the existing public window validation based on the same constant so users cannot submit a slot outside the published range.

### Task 2: Add Month Calendar Helpers

**Files:**
- Modify: `frontend/src/pages/appointmentConfirmationPage.helpers.js`
- Test: `tests/appointment-confirmation-page.test.js`

- [ ] Add helper functions to normalize a date to the first day of a month, add months, create a localized month label, and build all visible days for a month grid.
- [ ] Preserve existing `groupRescheduleOptionsByDay` and `buildPublicConfirmationPayload` behavior.

### Task 3: Add Public Month Navigation UI

**Files:**
- Modify: `frontend/src/pages/AppointmentConfirmationPage.jsx`

- [ ] Add state for the visible calendar month.
- [ ] Show previous/next month buttons and the visible month label.
- [ ] Disable previous month when the visible month is the current month.
- [ ] Keep day labels as `Livre` without slot counts.

### Task 4: Validate

**Files:**
- Test: `tests/appointment-confirmation-page.test.js`

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Validate the public confirmation page in a mobile viewport and confirm no horizontal overflow.
