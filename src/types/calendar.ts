export type CalendarEventColor =
  | 'periwinkle'
  | 'teal'
  | 'rose'
  | 'amber'

export type ThemePreference = 'dark' | 'light' | 'system'
export type TimeFormat = '24-hour' | '12-hour'
export type CalendarDensity = 'comfortable' | 'compact'
export type LanguagePreference = 'en' | 'fi'
export type EventDuration = 30 | 45 | 60 | 90
export type ReminderMinutes = 0 | 5 | 10 | 15 | 30 | 60

export type IntegrationProvider =
  | 'google-calendar'
  | 'outlook-calendar'

export type IntegrationStatus = 'connected' | 'disconnected'
export type SubscriptionPlan = 'free' | 'plus' | 'pro'

export interface LocalCalendar {
  id: string
  name: string
  color: CalendarEventColor
  timeZone: string
  defaultEventDuration: EventDuration
  defaultReminderMinutes: ReminderMinutes
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

interface CalendarEventBase {
  id: string
  calendarId: string
  externalUid?: string
  title: string
  description?: string
  location?: string
  color?: CalendarEventColor
  reminderMinutes?: ReminderMinutes
  createdAt: string
  updatedAt: string
}

export interface AllDayCalendarEvent
  extends CalendarEventBase {
  allDay: true
  startDate: string
  endDate: string
}

export interface TimedCalendarEvent
  extends CalendarEventBase {
  allDay: false
  startsAt: string
  endsAt: string
  timeZone: string
}

export type CalendarEvent =
  | AllDayCalendarEvent
  | TimedCalendarEvent

export interface CalendarEventDraft {
  calendarId: string
  title: string
  description?: string
  location?: string
  allDay: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeZone: string
  color?: CalendarEventColor
  reminderMinutes: ReminderMinutes
}

export interface DayframeSettings {
  id: 'preferences'
  theme: ThemePreference
  accentColor: string
  weekStartsOn: 0 | 1
  timeFormat: TimeFormat
  density: CalendarDensity
  showWeekNumbers: boolean
  defaultCalendarId: string
  displayTimeZone: string
  language: LanguagePreference
  notificationsEnabled: boolean
  notificationSoundEnabled: boolean
  defaultReminderMinutes: ReminderMinutes
  createdAt: string
  updatedAt: string
}

export interface LocalProfile {
  id: 'local-profile'
  displayName: string
  email: string
  isSignedIn: boolean
  createdAt: string
  updatedAt: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface LocalIntegration {
  id: IntegrationProvider
  provider: IntegrationProvider
  status: IntegrationStatus
  accountLabel?: string
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

export interface LocalSubscription {
  id: 'local-subscription'
  plan: SubscriptionPlan
  status: 'active'
  currentPeriodEnd?: string
  createdAt: string
  updatedAt: string
}

export type DayframeSettingsUpdate = Partial<
  Omit<DayframeSettings, 'id' | 'createdAt' | 'updatedAt'>
>

export type CalendarUpdate = Partial<
  Pick<
    LocalCalendar,
    | 'name'
    | 'color'
    | 'timeZone'
    | 'defaultEventDuration'
    | 'defaultReminderMinutes'
    | 'isVisible'
  >
>

export type LocalProfileUpdate = Partial<
  Pick<LocalProfile, 'displayName' | 'email' | 'isSignedIn'>
>

export type LocalIntegrationUpdate = Partial<
  Pick<
    LocalIntegration,
    'status' | 'accountLabel' | 'lastSyncAt'
  >
>

export type CalendarDeleteStrategy =
  | {
      type: 'move-events'
      targetCalendarId: string
    }
  | {
      type: 'delete-events'
    }
