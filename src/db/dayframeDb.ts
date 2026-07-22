import {
  addDays,
  addHours,
  format,
  parseISO,
} from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import Dexie, {
  type Table,
  type Transaction,
} from 'dexie'

import { getBrowserTimeZone } from '../lib/calendarEvents'
import type {
  AppNotification,
  CalendarEvent,
  CalendarEventColor,
  DayframeSettings,
  LocalCalendar,
  LocalIntegration,
  LocalProfile,
  LocalSubscription,
} from '../types/calendar'

export const defaultCalendarId = 'calendar-default'
export const settingsId = 'preferences'
export const localProfileId = 'local-profile'
export const localSubscriptionId = 'local-subscription'

interface LegacyCalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  color: CalendarEventColor
}

type MutableLegacyCalendarEvent = LegacyCalendarEvent &
  Record<string, unknown>

function createDefaultCalendar(): LocalCalendar {
  const timestamp = new Date().toISOString()

  return {
    id: defaultCalendarId,
    name: 'Personal',
    color: 'periwinkle',
    timeZone: getBrowserTimeZone(),
    defaultEventDuration: 60,
    defaultReminderMinutes: 10,
    isVisible: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultSettings(): DayframeSettings {
  const timestamp = new Date().toISOString()

  return {
    id: settingsId,
    theme: 'dark',
    accentColor: '#8e9cf4',
    weekStartsOn: 1,
    timeFormat: '24-hour',
    density: 'comfortable',
    showWeekNumbers: false,
    defaultCalendarId,
    displayTimeZone: getBrowserTimeZone(),
    language: 'en',
    notificationsEnabled: true,
    notificationSoundEnabled: false,
    defaultReminderMinutes: 10,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultProfile(): LocalProfile {
  const timestamp = new Date().toISOString()

  return {
    id: localProfileId,
    displayName: 'Local User',
    email: 'local@dayframe.demo',
    isSignedIn: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createDefaultIntegrations(): LocalIntegration[] {
  const timestamp = new Date().toISOString()

  return [
    {
      id: 'google-calendar',
      provider: 'google-calendar',
      status: 'disconnected',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'outlook-calendar',
      provider: 'outlook-calendar',
      status: 'disconnected',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

export function createDefaultSubscription(): LocalSubscription {
  const timestamp = new Date().toISOString()

  return {
    id: localSubscriptionId,
    plan: 'free',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function migrateLegacyEvent(
  legacyEvent: LegacyCalendarEvent,
  timeZone: string,
): CalendarEvent {
  const timestamp = new Date().toISOString()

  const baseEvent = {
    id: legacyEvent.id,
    calendarId: defaultCalendarId,
    title: legacyEvent.title,
    color: legacyEvent.color,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  if (!legacyEvent.time) {
    return {
      ...baseEvent,
      allDay: true,
      startDate: legacyEvent.date,
      endDate: format(
        addDays(parseISO(legacyEvent.date), 1),
        'yyyy-MM-dd',
      ),
    }
  }

  const startsAt = fromZonedTime(
    `${legacyEvent.date}T${legacyEvent.time}:00`,
    timeZone,
  )

  return {
    ...baseEvent,
    allDay: false,
    startsAt: startsAt.toISOString(),
    endsAt: addHours(startsAt, 1).toISOString(),
    timeZone,
  }
}

async function upgradeToVersionTwo(
  transaction: Transaction,
) {
  const defaultCalendar = createDefaultCalendar()

  await transaction
    .table<LocalCalendar, string>('calendars')
    .put(defaultCalendar)

  const legacyEvents = transaction.table<
    MutableLegacyCalendarEvent,
    string
  >('events')

  await legacyEvents.toCollection().modify((legacyEvent) => {
    const migratedEvent = migrateLegacyEvent(
      legacyEvent,
      defaultCalendar.timeZone,
    )

    for (const property of Object.keys(legacyEvent)) {
      delete legacyEvent[property]
    }

    Object.assign(legacyEvent, migratedEvent)
  })
}

class DayframeDatabase extends Dexie {
  calendars!: Table<LocalCalendar, string>
  events!: Table<CalendarEvent, string>
  settings!: Table<DayframeSettings, string>
  profile!: Table<LocalProfile, string>
  notifications!: Table<AppNotification, string>
  integrations!: Table<LocalIntegration, string>
  subscription!: Table<LocalSubscription, string>

  constructor() {
    super('dayframe')

    this.version(1).stores({
      events: 'id, date, time, color',
    })

    this.version(2)
      .stores({
        calendars:
          'id, name, color, timeZone, isVisible, createdAt',
        events:
          'id, calendarId, allDay, startDate, startsAt, updatedAt',
      })
      .upgrade(upgradeToVersionTwo)

    this.version(3).stores({
      calendars:
        'id, name, color, timeZone, createdAt',
      events:
        'id, calendarId, allDay, startDate, startsAt, updatedAt',
    })

    this.version(4).stores({
      calendars:
        'id, name, color, timeZone, createdAt',
      events:
        'id, calendarId, allDay, startDate, startsAt, updatedAt',
      settings: 'id',
    })

    this.version(5).stores({
      calendars:
        'id, name, color, timeZone, createdAt',
      events:
        'id, calendarId, allDay, startDate, startsAt, updatedAt',
      settings: 'id',
      profile: 'id',
      notifications: 'id, createdAt',
      integrations: 'id, status',
      subscription: 'id',
    })
  }
}

export const dayframeDb = new DayframeDatabase()

export async function ensureInitialData() {
  await dayframeDb.transaction(
    'rw',
    dayframeDb.calendars,
    dayframeDb.settings,
    dayframeDb.profile,
    dayframeDb.integrations,
    dayframeDb.subscription,
    async () => {
      const [
        calendars,
        settings,
        profile,
        integrations,
        subscription,
      ] = await Promise.all([
        dayframeDb.calendars.toArray(),
        dayframeDb.settings.get(settingsId),
        dayframeDb.profile.get(localProfileId),
        dayframeDb.integrations.toArray(),
        dayframeDb.subscription.get(localSubscriptionId),
      ])

      if (calendars.length === 0) {
        await dayframeDb.calendars.add(
          createDefaultCalendar(),
        )
      } else {
        await Promise.all(
          calendars.map((calendar) => {
            const changes: Partial<LocalCalendar> = {}

            if (calendar.defaultEventDuration === undefined) {
              changes.defaultEventDuration = 60
            }

            if (calendar.defaultReminderMinutes === undefined) {
              changes.defaultReminderMinutes = 10
            }

            return Object.keys(changes).length > 0
              ? dayframeDb.calendars.update(calendar.id, changes)
              : Promise.resolve(0)
          }),
        )
      }

      if (!settings) {
        await dayframeDb.settings.add(
          createDefaultSettings(),
        )
      } else {
        await dayframeDb.settings.put({
          ...createDefaultSettings(),
          ...settings,
        })
      }

      if (!profile) {
        await dayframeDb.profile.add(createDefaultProfile())
      }

      const integrationIds = new Set(
        integrations.map((integration) => integration.id),
      )

      const missingIntegrations =
        createDefaultIntegrations().filter(
          (integration) => !integrationIds.has(integration.id),
        )

      if (missingIntegrations.length > 0) {
        await dayframeDb.integrations.bulkAdd(
          missingIntegrations,
        )
      }

      if (!subscription) {
        await dayframeDb.subscription.add(
          createDefaultSubscription(),
        )
      }
    },
  )
}
