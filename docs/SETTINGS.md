# Dayframe V1 Settings

## Purpose

Settings controls Dayframe's appearance, calendar behavior, local profile, notifications, simulated product features, and browser-stored data.

Settings must remain understandable despite the larger showcase scope.

## Interface

Settings opens from a labelled button in the application header.

Desktop uses a temporary right-side sheet. Smaller screens use a full-screen settings view.

Sections:

1. Account
2. Appearance
3. Calendar
4. Language and region
5. Notifications
6. Calendars
7. Integrations
8. Billing
9. Data

Preferences save immediately unless the action modifies or deletes existing data.

## Account

Dayframe provides a local authentication simulation.

Available actions:

- Create local profile
- Sign in to an existing local profile
- Edit display name
- Edit local email identifier
- Sign out
- Delete local profile

The interface must always display:

> Local demo account. No account data leaves this browser.

The account is not a real security boundary and must not be presented as one.

## Appearance

### Theme

Options:

- Dark
- Light
- System

Default: Dark

### Accent color

Options:

- Periwinkle
- Teal
- Rose
- Amber
- Custom color

Default: Periwinkle

Custom colors require a valid CSS hexadecimal color.

Dayframe must calculate readable foreground colors rather than assuming all custom colors work with dark text.

### Calendar density

Options:

- Comfortable
- Compact

Default: Comfortable

## Calendar

### First day of the week

Options:

- Monday
- Sunday

Default: Monday

### Time format

Options:

- 24-hour
- 12-hour

Default: 24-hour

### Week numbers

Options:

- Off
- On

Default: Off

Week numbers use ISO 8601 numbering.

### Default calendar

Selects which calendar receives events created through the global New event button.

## Language and region

### Language

Initial options:

- English
- Finnish

Default: Browser language when supported, otherwise English.

### Display timezone

Default: Browser timezone.

The setting uses valid IANA timezone identifiers such as:

- `Europe/Helsinki`
- `Europe/London`
- `America/New_York`

Changing the display timezone changes how timed events are presented without modifying their stored instant.

## Notifications

### In-app notifications

Options:

- Enabled
- Disabled

Default: Enabled

### Default reminder

Options:

- None
- At event time
- 5 minutes before
- 10 minutes before
- 30 minutes before
- 1 hour before
- 1 day before

Default: None

### Demo notification

Provides a clearly labelled action that creates an immediate local test notification.

In-app notifications only appear while Dayframe is open.

No notification data is sent to a server.

## Calendars

Each local calendar has:

- Name
- Color
- Visibility
- Default event color
- Default reminder
- Default timezone
- Archive action
- Delete action

At least one calendar must remain active.

Deleting a calendar requires choosing whether its events are deleted or moved to another calendar.

## Integrations

### Calendar files

Real functionality:

- Import `.ics`
- Export one calendar as `.ics`
- Export all calendars as `.ics`

Files are processed locally.

### Google Calendar

Local simulation only.

The connector can demonstrate:

- Connection screen
- Permission explanation
- Connected state
- Simulated synchronization status
- Disconnect action

It must display:

> Demo connection. Dayframe does not contact Google or access a Google account.

### Outlook Calendar

Local simulation only.

It follows the same behavior and disclosure rules as the Google Calendar simulation.

## Billing

Billing is a local simulation.

Available demo plans:

- Free
- Plus
- Pro

The simulation may demonstrate:

- Plan comparison
- Upgrade flow
- Downgrade flow
- Subscription status
- Local invoice examples
- Cancellation flow

It must not request or imitate the collection of real card details.

Every billing surface must display:

> Billing demo. No payment is collected.

The selected demo plan is stored in IndexedDB.

## Data

### Export backup

Exports:

- Backup format version
- Export timestamp
- Local profiles
- Calendars
- Events
- Settings
- Notification state
- Simulated billing state
- Simulated integration state

### Restore backup

Validates the entire backup before replacing existing data.

Restoration requires explicit confirmation.

### Clear calendar data

Deletes calendars, events, and notifications while preserving the active local profile and appearance settings.

### Reset simulations

Resets billing and integration simulations without deleting calendar data.

### Delete all local data

Deletes every Dayframe IndexedDB record.

The action requires explicit confirmation and explains that exported backups are the only recovery mechanism.

## Non-goals

V1 Settings does not provide:

- Real accounts
- Cloud synchronization
- Real subscription management
- Real OAuth connections
- Server notifications
- Shared settings
- Analytics or tracking
