# Dayframe

## Product

Dayframe is a privacy-first calendar showcase that keeps all application data inside the browser while demonstrating the interface and workflows of a complete calendar product.

## User

A person who wants a calm, customizable calendar without clutter, ambiguous controls, or hidden data handling.

## Problem

Existing calendars make simple actions harder to understand than necessary and often require cloud accounts, external synchronization, and complicated interfaces.

## Promise

See your month. Add plans fast. Keep everything local.

## Core loop

1. Open a local profile.
2. Understand the month at a glance.
3. Select a calendar and day.
4. Create or modify an event.
5. Receive local notifications and manage the schedule without transmitting application data.

## Stage

Prototype.

## Evidence

Not applicable. Dayframe is a portfolio showcase rather than a product being validated for commercial distribution.

## V1

- Full-month calendar
- Multiple local calendars
- Month navigation
- Quick event creation
- Expanded event details
- Event editing and deletion
- Calendar and event colors
- Timezone-aware timed events
- All-day and multi-day events
- IndexedDB persistence
- Event overflow handling
- Local profile and authentication simulation
- Dark, light, and system themes
- Custom interface accent colors
- English and Finnish
- In-app notifications
- Per-calendar settings
- Local `.ics` import and export
- Simulated Google and Outlook connectors
- Simulated billing and subscription plans
- Data backup and restoration
- Responsive layout
- Accessible keyboard interaction

## Local-only guarantee

Dayframe does not transmit calendar, profile, billing, notification, or settings data.

All application state is stored in IndexedDB.

Authentication, billing, and provider connections are explicitly identified as local demo simulations.

`.ics` files are imported from and exported to files selected by the user.

## Non-goals

- Cloud backend
- Real authentication
- Real payments
- Real OAuth
- Real Google or Microsoft synchronization
- Shared calendars
- Invitations
- Server notifications
- Analytics or tracking
- Data collection

## Next

1. Expand events with end times, multi-day ranges, details, and explicit timezones.
2. Add calendar deletion with event reassignment.
3. Build the persistent Settings foundation.

## Decisions

- 2026-07-20: The project will be presented as a polished GitHub portfolio product.
- 2026-07-20: The primary UX goals are month-level clarity and fast event creation.
- 2026-07-20: The product name is Dayframe.
- 2026-07-20: The default visual direction is dark, subdued, spacious, and precise.
- 2026-07-21: V1 will use React, TypeScript, Vite, CSS Modules, and IndexedDB.
- 2026-07-21: Events will persist locally through Dexie.
- 2026-07-21: Authentication, billing, Google Calendar, and Outlook integrations will be clearly labelled local demo simulations.
- 2026-07-21: `.ics` import and export will provide real calendar interoperability.
- 2026-07-21: Timed events are stored as UTC instants paired with an IANA timezone.
- 2026-07-21: All-day events use timezone-independent ISO dates with an exclusive end date.
- 2026-07-21: Multiple calendars and visibility controls remain temporary overlays rather than permanent sidebar clutter.
