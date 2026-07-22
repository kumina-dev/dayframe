import { format } from 'date-fns'

import {
  dayframeDb,
  localProfileId,
  localSubscriptionId,
  settingsId,
} from '../db/dayframeDb'
import type {
  AppNotification,
  CalendarDensity,
  CalendarEvent,
  CalendarEventColor,
  DayframeSettings,
  EventDuration,
  IntegrationProvider,
  IntegrationStatus,
  LanguagePreference,
  LocalCalendar,
  LocalIntegration,
  LocalProfile,
  LocalSubscription,
  ReminderMinutes,
  SubscriptionPlan,
  ThemePreference,
  TimeFormat,
} from '../types/calendar'
import { isValidTimeZone } from './calendarEvents'
import { createIcsCalendar, parseIcsCalendar } from './ics'

interface DayframeBackupData {
  calendars: LocalCalendar[]
  events: CalendarEvent[]
  settings: DayframeSettings[]
  profile: LocalProfile[]
  notifications: AppNotification[]
  integrations: LocalIntegration[]
  subscription: LocalSubscription[]
}

interface DayframeBackup {
  app: 'dayframe'
  formatVersion: 1
  exportedAt: string
  data: DayframeBackupData
}

export interface DownloadableTextFile {
  content: string
  fileName: string
  mimeType: string
}

export interface IcsImportSummary {
  duplicates: number
  imported: number
  skippedInvalid: number
  skippedRecurring: number
}

export interface BackupRestoreSummary {
  calendars: number
  events: number
}

const calendarColors: CalendarEventColor[] = [
  'periwinkle',
  'teal',
  'rose',
  'amber',
]

const themes: ThemePreference[] = ['dark', 'light', 'system']
const timeFormats: TimeFormat[] = ['24-hour', '12-hour']
const densities: CalendarDensity[] = ['comfortable', 'compact']
const languages: LanguagePreference[] = ['en', 'fi']
const durations: EventDuration[] = [30, 45, 60, 90]
const reminders: ReminderMinutes[] = [0, 5, 10, 15, 30, 60]

const integrationProviders: IntegrationProvider[] = [
  'google-calendar',
  'outlook-calendar',
]

const integrationStatuses: IntegrationStatus[] = [
  'connected',
  'disconnected',
]

const subscriptionPlans: SubscriptionPlan[] = [
  'free',
  'plus',
  'pro',
]

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isOptionalString(
  value: unknown,
): value is string | undefined {
  return value === undefined || isString(value)
}

function isTimestamp(value: unknown): value is string {
  return (
    isString(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

function isDateKey(value: unknown): value is string {
  return (
    isString(value) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(
      Date.parse(`${value}T00:00:00Z`),
    )
  )
}

function isOneOf<T>(
  value: unknown,
  options: readonly T[],
): value is T {
  return options.includes(value as T)
}

function hasTimestamps(
  value: Record<string, unknown>,
) {
  return (
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  )
}

function isLocalCalendar(
  value: unknown,
): value is LocalCalendar {
  return (
    isRecord(value) &&
    isString(value.id) &&
    value.id.length > 0 &&
    isString(value.name) &&
    value.name.length > 0 &&
    isOneOf(value.color, calendarColors) &&
    isString(value.timeZone) &&
    isValidTimeZone(value.timeZone) &&
    isOneOf(
      value.defaultEventDuration,
      durations,
    ) &&
    isOneOf(
      value.defaultReminderMinutes,
      reminders,
    ) &&
    typeof value.isVisible === 'boolean' &&
    hasTimestamps(value)
  )
}

function hasValidEventBase(
  value: Record<string, unknown>,
) {
  return (
    isString(value.id) &&
    value.id.length > 0 &&
    isString(value.calendarId) &&
    value.calendarId.length > 0 &&
    isOptionalString(value.externalUid) &&
    isString(value.title) &&
    isOptionalString(value.description) &&
    isOptionalString(value.location) &&
    (value.color === undefined ||
      isOneOf(value.color, calendarColors)) &&
    (value.reminderMinutes === undefined ||
      isOneOf(
        value.reminderMinutes,
        reminders,
      )) &&
    hasTimestamps(value)
  )
}

function isCalendarEvent(
  value: unknown,
): value is CalendarEvent {
  if (
    !isRecord(value) ||
    !hasValidEventBase(value)
  ) {
    return false
  }

  if (value.allDay === true) {
    const { endDate, startDate } = value

    return (
      isDateKey(startDate) &&
      isDateKey(endDate) &&
      endDate > startDate
    )
  }

  if (value.allDay === false) {
    const { endsAt, startsAt } = value

    return (
      isTimestamp(startsAt) &&
      isTimestamp(endsAt) &&
      endsAt > startsAt &&
      isString(value.timeZone) &&
      isValidTimeZone(value.timeZone)
    )
  }

  return false
}

function isDayframeSettings(
  value: unknown,
): value is DayframeSettings {
  return (
    isRecord(value) &&
    value.id === settingsId &&
    isOneOf(value.theme, themes) &&
    isString(value.accentColor) &&
    /^#[\da-f]{6}$/i.test(value.accentColor) &&
    (value.weekStartsOn === 0 ||
      value.weekStartsOn === 1) &&
    isOneOf(value.timeFormat, timeFormats) &&
    isOneOf(value.density, densities) &&
    typeof value.showWeekNumbers === 'boolean' &&
    isString(value.defaultCalendarId) &&
    isString(value.displayTimeZone) &&
    isValidTimeZone(value.displayTimeZone) &&
    isOneOf(value.language, languages) &&
    typeof value.notificationsEnabled ===
      'boolean' &&
    typeof value.notificationSoundEnabled ===
      'boolean' &&
    isOneOf(
      value.defaultReminderMinutes,
      reminders,
    ) &&
    hasTimestamps(value)
  )
}

function isLocalProfile(
  value: unknown,
): value is LocalProfile {
  return (
    isRecord(value) &&
    value.id === localProfileId &&
    isString(value.displayName) &&
    value.displayName.length > 0 &&
    isString(value.email) &&
    typeof value.isSignedIn === 'boolean' &&
    hasTimestamps(value)
  )
}

function isAppNotification(
  value: unknown,
): value is AppNotification {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.message) &&
    typeof value.isRead === 'boolean' &&
    isTimestamp(value.createdAt)
  )
}

function isLocalIntegration(
  value: unknown,
): value is LocalIntegration {
  return (
    isRecord(value) &&
    isOneOf(value.id, integrationProviders) &&
    value.id === value.provider &&
    isOneOf(
      value.status,
      integrationStatuses,
    ) &&
    isOptionalString(value.accountLabel) &&
    (value.lastSyncAt === undefined ||
      isTimestamp(value.lastSyncAt)) &&
    hasTimestamps(value)
  )
}

function isLocalSubscription(
  value: unknown,
): value is LocalSubscription {
  return (
    isRecord(value) &&
    value.id === localSubscriptionId &&
    isOneOf(value.plan, subscriptionPlans) &&
    value.status === 'active' &&
    (value.currentPeriodEnd === undefined ||
      isTimestamp(value.currentPeriodEnd)) &&
    hasTimestamps(value)
  )
}

function hasUniqueIds(
  values: Array<{ id: string }>,
) {
  return (
    new Set(
      values.map((value) => value.id),
    ).size === values.length
  )
}

function validateBackup(
  value: unknown,
): DayframeBackup {
  if (
    !isRecord(value) ||
    value.app !== 'dayframe' ||
    value.formatVersion !== 1 ||
    !isTimestamp(value.exportedAt) ||
    !isRecord(value.data)
  ) {
    throw new Error(
      'This is not a supported Dayframe backup.',
    )
  }

  const data = value.data

  const arrays = [
    data.calendars,
    data.events,
    data.settings,
    data.profile,
    data.notifications,
    data.integrations,
    data.subscription,
  ]

  if (!arrays.every(Array.isArray)) {
    throw new Error(
      'The Dayframe backup is incomplete.',
    )
  }

  const calendars = data.calendars as unknown[]
  const events = data.events as unknown[]
  const settings = data.settings as unknown[]
  const profile = data.profile as unknown[]
  const notifications =
    data.notifications as unknown[]
  const integrations =
    data.integrations as unknown[]
  const subscription =
    data.subscription as unknown[]

  if (
    calendars.length === 0 ||
    settings.length !== 1 ||
    profile.length !== 1 ||
    subscription.length !== 1 ||
    !calendars.every(isLocalCalendar) ||
    !events.every(isCalendarEvent) ||
    !settings.every(isDayframeSettings) ||
    !profile.every(isLocalProfile) ||
    !notifications.every(isAppNotification) ||
    !integrations.every(isLocalIntegration) ||
    !subscription.every(isLocalSubscription)
  ) {
    throw new Error(
      'The Dayframe backup contains invalid data.',
    )
  }

  const typedCalendars =
    calendars as LocalCalendar[]

  const typedEvents =
    events as CalendarEvent[]

  const typedSettings =
    settings as DayframeSettings[]

  const typedNotifications =
    notifications as AppNotification[]

  const typedIntegrations =
    integrations as LocalIntegration[]

  const calendarIds = new Set(
    typedCalendars.map(
      (calendar) => calendar.id,
    ),
  )

  if (
    !typedCalendars.some(
      (calendar) => calendar.isVisible,
    ) ||
    !calendarIds.has(
      typedSettings[0].defaultCalendarId,
    ) ||
    typedEvents.some(
      (event) =>
        !calendarIds.has(event.calendarId),
    ) ||
    !hasUniqueIds(typedCalendars) ||
    !hasUniqueIds(typedEvents) ||
    !hasUniqueIds(typedNotifications) ||
    !hasUniqueIds(typedIntegrations)
  ) {
    throw new Error(
      'The Dayframe backup contains conflicting records.',
    )
  }

  return value as unknown as DayframeBackup
}

function createFileDate() {
  return format(new Date(), 'yyyy-MM-dd')
}

function slugifyFileName(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'calendar'
  )
}

export function downloadTextFile(
  file: DownloadableTextFile,
) {
  const blob = new Blob([file.content], {
    type: file.mimeType,
  })

  const objectUrl =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = objectUrl
  link.download = file.fileName
  link.hidden = true

  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    0,
  )
}

export async function createCalendarFile(
  calendarId: string,
): Promise<DownloadableTextFile> {
  const [calendar, events] =
    await Promise.all([
      dayframeDb.calendars.get(calendarId),
      dayframeDb.events
        .where('calendarId')
        .equals(calendarId)
        .toArray(),
    ])

  if (!calendar) {
    throw new Error(
      'The selected calendar no longer exists.',
    )
  }

  return {
    content: createIcsCalendar(
      calendar,
      events,
    ),
    fileName: `${slugifyFileName(
      calendar.name,
    )}-${createFileDate()}.ics`,
    mimeType:
      'text/calendar;charset=utf-8',
  }
}

export async function importCalendarFile(
  content: string,
  calendarId: string,
): Promise<IcsImportSummary> {
  const calendar =
    await dayframeDb.calendars.get(
      calendarId,
    )

  if (!calendar) {
    throw new Error(
      'The target calendar no longer exists.',
    )
  }

  const parsed = parseIcsCalendar(
    content,
    calendar,
  )

  const existingEvents =
    await dayframeDb.events
      .where('calendarId')
      .equals(calendarId)
      .toArray()

  const knownUids = new Set(
    existingEvents
      .map((event) => event.externalUid)
      .filter(
        (uid): uid is string =>
          Boolean(uid),
      ),
  )

  const importedEvents: CalendarEvent[] = []
  let duplicates = 0

  for (const event of parsed.events) {
    if (
      event.externalUid &&
      knownUids.has(event.externalUid)
    ) {
      duplicates += 1
      continue
    }

    if (event.externalUid) {
      knownUids.add(event.externalUid)
    }

    importedEvents.push(event)
  }

  if (importedEvents.length > 0) {
    await dayframeDb.events.bulkAdd(
      importedEvents,
    )
  }

  return {
    duplicates,
    imported: importedEvents.length,
    skippedInvalid: parsed.skippedInvalid,
    skippedRecurring:
      parsed.skippedRecurring,
  }
}

export async function createBackupFile(): Promise<DownloadableTextFile> {
  const [
    calendars,
    events,
    settings,
    profile,
    notifications,
    integrations,
    subscription,
  ] = await Promise.all([
    dayframeDb.calendars.toArray(),
    dayframeDb.events.toArray(),
    dayframeDb.settings.toArray(),
    dayframeDb.profile.toArray(),
    dayframeDb.notifications.toArray(),
    dayframeDb.integrations.toArray(),
    dayframeDb.subscription.toArray(),
  ])

  const backup: DayframeBackup = {
    app: 'dayframe',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      calendars,
      events,
      settings,
      profile,
      notifications,
      integrations,
      subscription,
    },
  }

  return {
    content: JSON.stringify(
      backup,
      null,
      2,
    ),
    fileName:
      `dayframe-backup-${createFileDate()}.json`,
    mimeType:
      'application/json;charset=utf-8',
  }
}

export async function restoreBackupFile(
  content: string,
): Promise<BackupRestoreSummary> {
  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(content)
  } catch {
    throw new Error(
      'The selected backup is not valid JSON.',
    )
  }

  const backup =
    validateBackup(parsedValue)

  const { data } = backup

  await dayframeDb.transaction(
    'rw',
    [
      dayframeDb.calendars,
      dayframeDb.events,
      dayframeDb.settings,
      dayframeDb.profile,
      dayframeDb.notifications,
      dayframeDb.integrations,
      dayframeDb.subscription,
    ],
    async () => {
      await Promise.all([
        dayframeDb.calendars.clear(),
        dayframeDb.events.clear(),
        dayframeDb.settings.clear(),
        dayframeDb.profile.clear(),
        dayframeDb.notifications.clear(),
        dayframeDb.integrations.clear(),
        dayframeDb.subscription.clear(),
      ])

      await Promise.all([
        dayframeDb.calendars.bulkAdd(
          data.calendars,
        ),
        dayframeDb.events.bulkAdd(
          data.events,
        ),
        dayframeDb.settings.bulkAdd(
          data.settings,
        ),
        dayframeDb.profile.bulkAdd(
          data.profile,
        ),
        dayframeDb.notifications.bulkAdd(
          data.notifications,
        ),
        dayframeDb.integrations.bulkAdd(
          data.integrations,
        ),
        dayframeDb.subscription.bulkAdd(
          data.subscription,
        ),
      ])
    },
  )

  return {
    calendars: data.calendars.length,
    events: data.events.length,
  }
}
