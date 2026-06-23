# Mobile Calendar Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CliniDent responsive in mobile browsers while preserving the desktop layout, with special attention to calendar rescheduling and a mobile hamburger sidebar.

**Architecture:** Update the global shell first so every screen has a responsive container and mobile navigation. Then improve shared UI primitives and adapt the high-traffic screens that currently rely on desktop-width grids.

**Tech Stack:** React 19, Vite, Tailwind CSS, lucide-react, existing component library.

---

### Task 1: Responsive App Shell

**Files:**
- Modify: `frontend/src/components/layout/MainLayout.jsx`
- Modify: `frontend/src/components/layout/Header.jsx`
- Modify: `frontend/src/components/layout/Sidebar.jsx`

- [ ] Add mobile menu state in `MainLayout`.
- [ ] Pass `onOpenMenu` into `Header`.
- [ ] Render `Sidebar` as desktop static navigation and mobile drawer.
- [ ] Close the mobile drawer after navigation or logout.
- [ ] Reduce mobile content padding and keep desktop spacing intact.
- [ ] Verify that the shell has no horizontal overflow at 390px wide.

### Task 2: Responsive Modal Primitive

**Files:**
- Modify: `frontend/src/components/ui/Modal.jsx`

- [ ] Make modal overlay align to bottom on small screens and center on desktop.
- [ ] Give modal content mobile-safe width, height, border radius and scroll behavior.
- [ ] Keep existing focus trap and escape behavior unchanged.
- [ ] Verify appointment and patient modals remain usable on mobile.

### Task 3: Calendar Mobile Experience

**Files:**
- Modify: `frontend/src/components/calendar/CalendarView.jsx`
- Modify: `frontend/src/components/calendar/MonthlyCalendar.jsx`
- Modify: `frontend/src/components/calendar/DaySlotsPanel.jsx`
- Modify: `frontend/src/components/calendar/AgendaSummaryRail.jsx`

- [ ] Tighten the agenda header and action controls on mobile.
- [ ] Make the monthly calendar cells compact on mobile and detailed on desktop.
- [ ] Keep month navigation obvious for future months.
- [ ] Add a mobile weekly agenda list while preserving the desktop weekly grid.
- [ ] Ensure day slots and daily summary stack cleanly without horizontal overflow.
- [ ] Make the appointment form fields one-column on mobile.

### Task 4: Dashboard, Patients and Forms

**Files:**
- Modify: `frontend/src/components/dashboard/DashboardView.jsx`
- Modify: `frontend/src/components/patients/PatientsView.jsx`
- Modify: `frontend/src/components/patients/NewPatientView.jsx`
- Modify: `frontend/src/components/patients/PatientDetailModal.jsx` if needed after preserving current local edits
- Modify: `frontend/src/components/auth/LoginScreen.jsx`

- [ ] Make dashboard action rows stack on mobile.
- [ ] Hide patient table headers on mobile and present each row as a labeled card.
- [ ] Adjust patient search controls so badges and clear buttons do not overlap text.
- [ ] Ensure patient forms and final action bars use single-column mobile layout.
- [ ] Keep login form readable on small screens.

### Task 5: Verification

**Files:**
- No source files expected unless verification reveals defects.

- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Start the frontend dev server.
- [ ] Inspect desktop and mobile viewports for shell, agenda, patients, dashboard and login.
- [ ] Fix any responsive overflow or build issue introduced by this work.
