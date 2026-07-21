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
  CalendarEvent,
  CalendarEventColor,
  DayframeSettings,
  LocalCalendar,
} from '../types/calendar'

export const defaultCalendarId = 'calendar-default'
export const settingsId = 'preferences'

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
  }
}

export const dayframeDb = new DayframeDatabase()

export async function ensureInitialData() {
  await dayframeDb.transaction(
    'rw',
    dayframeDb.calendars,
    dayframeDb.settings,
    async () => {
      const [calendarCount, settings] = await Promise.all([
        dayframeDb.calendars.count(),
        dayframeDb.settings.get(settingsId),
      ])

      if (calendarCount === 0) {
        await dayframeDb.calendars.add(
          createDefaultCalendar(),
        )
      }

      if (!settings) {
        await dayframeDb.settings.add(
          createDefaultSettings(),
        )
      }
    },
  )
}
