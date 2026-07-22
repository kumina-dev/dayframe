import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  format,
  parseISO,
} from 'date-fns'
import {
  formatInTimeZone,
  fromZonedTime,
} from 'date-fns-tz'

import type {
  CalendarEvent,
  CalendarEventDraft,
  LocalCalendar,
  ReminderMinutes,
  TimeFormat,
} from '../types/calendar'

interface CreateCalendarEventOptions {
  existingEvent?: CalendarEvent
}

export function getBrowserTimeZone() {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  )
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en', {
      timeZone,
    }).format()

    return true
  } catch {
    return false
  }
}

export function createEmptyEventDraft(
  date: string,
  calendar: LocalCalendar,
): CalendarEventDraft {
  const startTime = '09:00'
  const endTime = format(
    addMinutes(
      parseISO(`2000-01-01T${startTime}:00`),
      calendar.defaultEventDuration,
    ),
    'HH:mm',
  )

  return {
    calendarId: calendar.id,
    title: '',
    allDay: true,
    startDate: date,
    endDate: date,
    startTime,
    endTime,
    timeZone: calendar.timeZone,
    reminderMinutes: calendar.defaultReminderMinutes,
  }
}

export function validateCalendarEventDraft(
  draft: CalendarEventDraft,
) {
  if (!draft.title.trim()) {
    return 'Enter an event title.'
  }

  if (!draft.calendarId) {
    return 'Select a calendar.'
  }

  if (!draft.startDate || !draft.endDate) {
    return 'Enter the event dates.'
  }

  if (draft.endDate < draft.startDate) {
    return 'The end date cannot be before the start date.'
  }

  if (draft.allDay) {
    return null
  }

  if (!draft.startTime || !draft.endTime) {
    return 'Enter the start and end times.'
  }

  if (!isValidTimeZone(draft.timeZone)) {
    return 'Enter a valid IANA timezone.'
  }

  const startsAt = fromZonedTime(
    `${draft.startDate}T${draft.startTime}:00`,
    draft.timeZone,
  )

  const endsAt = fromZonedTime(
    `${draft.endDate}T${draft.endTime}:00`,
    draft.timeZone,
  )

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    return 'The event date or timezone is invalid.'
  }

  if (endsAt <= startsAt) {
    return 'The event must end after it starts.'
  }

  return null
}

export function createCalendarEventRecord(
  draft: CalendarEventDraft,
  { existingEvent }: CreateCalendarEventOptions = {},
): CalendarEvent {
  const validationError =
    validateCalendarEventDraft(draft)

  if (validationError) {
    throw new Error(validationError)
  }

  const now = new Date().toISOString()

  const baseEvent = {
    id: existingEvent?.id ?? crypto.randomUUID(),
    calendarId: draft.calendarId,
    title: draft.title.trim(),
    description: draft.description?.trim() || undefined,
    location: draft.location?.trim() || undefined,
    color: draft.color,
    reminderMinutes: draft.reminderMinutes,
    createdAt: existingEvent?.createdAt ?? now,
    updatedAt: now,
  }

  if (draft.allDay) {
    return {
      ...baseEvent,
      allDay: true,
      startDate: draft.startDate,
      endDate: format(
        addDays(parseISO(draft.endDate), 1),
        'yyyy-MM-dd',
      ),
    }
  }

  const startsAt = fromZonedTime(
    `${draft.startDate}T${draft.startTime}:00`,
    draft.timeZone,
  )

  const endsAt = fromZonedTime(
    `${draft.endDate}T${draft.endTime}:00`,
    draft.timeZone,
  )

  return {
    ...baseEvent,
    allDay: false,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    timeZone: draft.timeZone,
  }
}

export function calendarEventToDraft(
  event: CalendarEvent,
  fallbackTimeZone = getBrowserTimeZone(),
  fallbackReminderMinutes: ReminderMinutes = 10,
): CalendarEventDraft {
  if (event.allDay) {
    return {
      calendarId: event.calendarId,
      title: event.title,
      description: event.description,
      location: event.location,
      allDay: true,
      startDate: event.startDate,
      endDate: format(
        addDays(parseISO(event.endDate), -1),
        'yyyy-MM-dd',
      ),
      startTime: '09:00',
      endTime: '10:00',
      timeZone: fallbackTimeZone,
      color: event.color,
      reminderMinutes:
        event.reminderMinutes ?? fallbackReminderMinutes,
    }
  }

  return {
    calendarId: event.calendarId,
    title: event.title,
    description: event.description,
    location: event.location,
    allDay: false,
    startDate: formatInTimeZone(
      event.startsAt,
      event.timeZone,
      'yyyy-MM-dd',
    ),
    endDate: formatInTimeZone(
      event.endsAt,
      event.timeZone,
      'yyyy-MM-dd',
    ),
    startTime: formatInTimeZone(
      event.startsAt,
      event.timeZone,
      'HH:mm',
    ),
    endTime: formatInTimeZone(
      event.endsAt,
      event.timeZone,
      'HH:mm',
    ),
    timeZone: event.timeZone,
    color: event.color,
    reminderMinutes:
      event.reminderMinutes ?? fallbackReminderMinutes,
  }
}

export function getCalendarEventDateKeys(
  event: CalendarEvent,
  displayTimeZone: string,
) {
  if (event.allDay) {
    const inclusiveEndDate = addDays(
      parseISO(event.endDate),
      -1,
    )

    if (inclusiveEndDate < parseISO(event.startDate)) {
      return [event.startDate]
    }

    return eachDayOfInterval({
      start: parseISO(event.startDate),
      end: inclusiveEndDate,
    }).map((date) => format(date, 'yyyy-MM-dd'))
  }

  const startDateKey = formatInTimeZone(
    event.startsAt,
    displayTimeZone,
    'yyyy-MM-dd',
  )

  const inclusiveEndInstant = new Date(
    Math.max(
      new Date(event.startsAt).getTime(),
      new Date(event.endsAt).getTime() - 1,
    ),
  )

  const endDateKey = formatInTimeZone(
    inclusiveEndInstant,
    displayTimeZone,
    'yyyy-MM-dd',
  )

  return eachDayOfInterval({
    start: parseISO(startDateKey),
    end: parseISO(endDateKey),
  }).map((date) => format(date, 'yyyy-MM-dd'))
}

export function getCalendarEventTimeLabel(
  event: CalendarEvent,
  dateKey: string,
  displayTimeZone: string,
  timeFormat: TimeFormat = '24-hour',
) {
  if (event.allDay) {
    return undefined
  }

  const startDateKey = formatInTimeZone(
    event.startsAt,
    displayTimeZone,
    'yyyy-MM-dd',
  )

  if (dateKey !== startDateKey) {
    return undefined
  }

  return formatInTimeZone(
    event.startsAt,
    displayTimeZone,
    timeFormat === '12-hour' ? 'h:mm a' : 'HH:mm',
  )
}
