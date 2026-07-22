# Dayframe

A privacy-first calendar showcase designed around two things: understanding the entire month at a glance and creating events quickly.

Dayframe demonstrates the interface and workflows of a larger calendar product while storing all application data locally in the browser.

## Current functionality

- Full-month calendar
- Multiple local calendars
- Calendar creation and renaming
- Calendar visibility controls
- Calendar colors
- Per-event color overrides
- Per-calendar timezone, duration, and reminder defaults
- Calendar selection when creating or editing events
- Calendar deletion with event deletion or reassignment
- Previous, next, and current-month navigation
- Quick event creation
- Event editing
- Expanded optional event details
- Multi-day events
- Confirmed event deletion
- IndexedDB persistence
- Timezone-safe timed-event storage
- All-day event storage
- Automatic database migration
- Events arranged chronologically by day
- Dark, light, and system themes
- Preset and custom accent colors
- English and Finnish calendar date labels
- Local in-app notification simulation
- Local profile and authentication simulation
- Simulated Google Calendar and Outlook connection states
- Simulated billing and subscription plans
- Full-screen, category-based settings
- Local `.ics` import and export for non-recurring events
- Duplicate-aware iCalendar imports
- Validated full-data JSON backup and restoration
- Responsive desktop layout

## Planned V1 functionality

- Recurring events
- Complete Finnish interface translation
- Additional mobile layout refinement
- Automated tests

## Local-only architecture

Calendar, profile, notification, billing, integration, and settings data is stored in IndexedDB.

Dayframe does not provide a cloud backend or transmit application data.

Authentication, billing, Google Calendar, and Outlook functionality are local demo simulations. Their interfaces are clearly labelled and do not contact external providers.

`.ics` import and export provides real calendar interoperability using files selected by the user. Dayframe V1 reports and skips recurring rules until recurrence is supported by its event model.

JSON backups preserve Dayframe-specific settings and local demo states. Backup files are validated before the current IndexedDB records are replaced in one transaction.

## Stack

- React
- TypeScript
- Vite
- CSS Modules
- date-fns
- date-fns-tz
- Dexie
- IndexedDB
- Lucide Icons
- pnpm

## Development

```bash
pnpm install
pnpm dev
```

## Product principles

- The schedule remains the visual priority.
- Primary actions are visible and understandable.
- Optional fields never obstruct quick event creation.
- Empty space is preferable to interface clutter.
- Destructive actions require explicit confirmation.
- Simulated features are labelled honestly.
- Application data remains inside the browser.
- The interface does not imitate a productivity dashboard.
