export type CalendarEventColor =
  | 'periwinkle'
  | 'teal'
  | 'rose'
  | 'amber'

export type ThemePreference = 'dark' | 'light' | 'system'
export type TimeFormat = '24-hour' | '12-hour'
export type CalendarDensity = 'comfortable' | 'compact'

export interface LocalCalendar {
  id: string
  name: string
  color: CalendarEventColor
  timeZone: string
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

interface CalendarEventBase {
  id: string
  calendarId: string
  title: string
  description?: string
  location?: string
  color?: CalendarEventColor
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
  createdAt: string
  updatedAt: string
}

export type DayframeSettingsUpdate = Partial<
  Omit<DayframeSettings, 'id' | 'createdAt' | 'updatedAt'>
>

export type CalendarUpdate = Partial<
  Pick<LocalCalendar, 'name' | 'color' | 'isVisible'>
>

export type CalendarDeleteStrategy =
  | {
      type: 'move-events'
      targetCalendarId: string
    }
  | {
      type: 'delete-events'
    }
