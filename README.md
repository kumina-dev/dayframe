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
- Calendar selection when creating or editing events
- Previous, next, and current-month navigation
- Quick event creation
- Event editing
- Confirmed event deletion
- IndexedDB persistence
- Timezone-safe timed-event storage
- All-day event storage
- Automatic database migration
- Events arranged chronologically by day
- Responsive desktop layout
- Dark visual system

## Planned V1 functionality

- Calendar deletion and event reassignment
- Expanded event details
- Multi-day events
- Dark, light, and system themes
- Custom accent colors
- English and Finnish
- In-app notifications
- Per-calendar settings
- Local profile and authentication simulation
- Local `.ics` import and export
- Simulated Google Calendar and Outlook connectors
- Simulated billing and subscription plans
- Data backup and restoration
- Responsive mobile layout
- Automated tests

## Local-only architecture

Calendar, profile, notification, billing, integration, and settings data is stored in IndexedDB.

Dayframe does not provide a cloud backend or transmit application data.

Authentication, billing, Google Calendar, and Outlook functionality are local demo simulations. Their interfaces are clearly labelled and do not contact external providers.

`.ics` import and export provides real calendar interoperability using files selected by the user.

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
