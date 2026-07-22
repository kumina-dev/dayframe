import { addDays, addMinutes, format, parseISO } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

import type {
  CalendarEvent,
  CalendarEventColor,
  LocalCalendar,
  ReminderMinutes,
} from '../types/calendar'
import {
  calendarEventColorDetails,
  calendarEventColors,
} from './calendarColors'
import { isValidTimeZone } from './calendarEvents'

interface IcsProperty {
  name: string
  parameters: Record<string, string>
  value: string
}

interface RawIcsEvent {
  properties: Map<string, IcsProperty[]>
  alarmTrigger?: IcsProperty
}

interface ParsedDateValue {
  type: 'date' | 'date-time'
  value: string | Date
}

export interface ParsedIcsCalendar {
  events: CalendarEvent[]
  skippedInvalid: number
  skippedRecurring: number
}

const reminderValues: ReminderMinutes[] = [0, 5, 10, 15, 30, 60]

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function foldIcsLine(value: string) {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let currentLine = ''
  let currentBytes = 0
  const byteLimit = 75

  for (const character of value) {
    const characterBytes = encoder.encode(character).length

    if (
      currentLine &&
      currentBytes + characterBytes > byteLimit
    ) {
      lines.push(currentLine)
      currentLine = ` ${character}`
      currentBytes = 1 + characterBytes
      continue
    }

    currentLine += character
    currentBytes += characterBytes
  }

  lines.push(currentLine)
  return lines.join('\r\n')
}

function formatUtcDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)

  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function formatDateOnly(value: string) {
  return value.replace(/-/g, '')
}

function serializeEvent(event: CalendarEvent) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(
      event.externalUid ?? `${event.id}@dayframe.local`,
    )}`,
    `DTSTAMP:${formatUtcDate(new Date())}`,
    `CREATED:${formatUtcDate(event.createdAt)}`,
    `LAST-MODIFIED:${formatUtcDate(event.updatedAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`)
  }

  if (event.color) {
    lines.push(`X-DAYFRAME-COLOR:${event.color}`)
    lines.push(
      `COLOR:${calendarEventColorDetails[event.color].value}`,
    )
  }

  if (event.allDay) {
    lines.push(
      `DTSTART;VALUE=DATE:${formatDateOnly(event.startDate)}`,
      `DTEND;VALUE=DATE:${formatDateOnly(event.endDate)}`,
    )
  } else {
    lines.push(
      `DTSTART:${formatUtcDate(event.startsAt)}`,
      `DTEND:${formatUtcDate(event.endsAt)}`,
      `X-DAYFRAME-TIMEZONE:${escapeIcsText(event.timeZone)}`,
    )
  }

  if (event.reminderMinutes !== undefined) {
    const trigger =
      event.reminderMinutes === 0
        ? 'PT0M'
        : `-PT${event.reminderMinutes}M`

    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `TRIGGER:${trigger}`,
      `DESCRIPTION:${escapeIcsText(`${event.title} reminder`)}`,
      'END:VALARM',
    )
  }

  lines.push('END:VEVENT')
  return lines
}

export function createIcsCalendar(
  calendar: LocalCalendar,
  events: CalendarEvent[],
) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dayframe//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendar.name)}`,
  ]

  for (const event of events) {
    lines.push(...serializeEvent(event))
  }

  lines.push('END:VCALENDAR')

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

function parseProperty(line: string): IcsProperty | null {
  const separatorIndex = line.indexOf(':')

  if (separatorIndex < 1) {
    return null
  }

  const header = line.slice(0, separatorIndex)
  const value = line.slice(separatorIndex + 1)
  const [rawName, ...rawParameters] = header.split(';')
  const name = rawName.toUpperCase()
  const parameters: Record<string, string> = {}

  for (const rawParameter of rawParameters) {
    const equalsIndex = rawParameter.indexOf('=')

    if (equalsIndex < 1) {
      continue
    }

    const parameterName = rawParameter
      .slice(0, equalsIndex)
      .toUpperCase()

    const parameterValue = rawParameter
      .slice(equalsIndex + 1)
      .replace(/^"|"$/g, '')

    parameters[parameterName] = parameterValue
  }

  return {
    name,
    parameters,
    value,
  }
}

function readRawEvents(content: string) {
  const unfoldedContent = content
    .replace(/^\uFEFF/, '')
    .replace(/\r?\n[ \t]/g, '')

  const lines = unfoldedContent.split(/\r?\n/)

  if (
    !lines.some(
      (line) => line.trim().toUpperCase() === 'BEGIN:VCALENDAR',
    )
  ) {
    throw new Error('This file is not an iCalendar file.')
  }

  const events: RawIcsEvent[] = []
  let currentEvent: RawIcsEvent | null = null
  const nestedComponents: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const normalizedLine = line.toUpperCase()

    if (normalizedLine === 'BEGIN:VEVENT') {
      currentEvent = {
        properties: new Map(),
      }
      nestedComponents.length = 0
      continue
    }

    if (!currentEvent) {
      continue
    }

    if (normalizedLine.startsWith('BEGIN:')) {
      nestedComponents.push(normalizedLine.slice(6))
      continue
    }

    if (normalizedLine.startsWith('END:')) {
      const componentName = normalizedLine.slice(4)

      if (
        componentName === 'VEVENT' &&
        nestedComponents.length === 0
      ) {
        events.push(currentEvent)
        currentEvent = null
        continue
      }

      if (
        nestedComponents[nestedComponents.length - 1] ===
        componentName
      ) {
        nestedComponents.pop()
      }

      continue
    }

    const property = parseProperty(line)

    if (!property) {
      continue
    }

    if (
      nestedComponents[nestedComponents.length - 1] ===
        'VALARM' &&
      property.name === 'TRIGGER' &&
      !currentEvent.alarmTrigger
    ) {
      currentEvent.alarmTrigger = property
      continue
    }

    if (nestedComponents.length > 0) {
      continue
    }

    const properties =
      currentEvent.properties.get(property.name) ?? []

    properties.push(property)
    currentEvent.properties.set(property.name, properties)
  }

  return events
}

function getFirstProperty(
  event: RawIcsEvent,
  name: string,
) {
  return event.properties.get(name)?.[0]
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  const dateKey = `${year}-${month}-${day}`
  const parsedDate = parseISO(dateKey)

  return Number.isNaN(parsedDate.getTime()) ? null : dateKey
}

function parseDateTime(
  property: IcsProperty,
  fallbackTimeZone: string,
): ParsedDateValue | null {
  const value = property.value.trim()

  if (
    property.parameters.VALUE?.toUpperCase() === 'DATE' ||
    /^\d{8}$/.test(value)
  ) {
    const date = parseDateOnly(value)

    return date
      ? {
          type: 'date',
          value: date,
        }
      : null
  }

  const match =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z|[+-]\d{4})?$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = '00',
    suffix,
  ] = match

  const localValue = `${year}-${month}-${day}T${hour}:${minute}:${second}`
  let date: Date

  if (suffix === 'Z') {
    date = new Date(`${localValue}Z`)
  } else if (
    suffix?.startsWith('+') ||
    suffix?.startsWith('-')
  ) {
    const offset = `${suffix.slice(0, 3)}:${suffix.slice(3)}`
    date = new Date(`${localValue}${offset}`)
  } else {
    const requestedTimeZone = property.parameters.TZID
    const timeZone =
      requestedTimeZone && isValidTimeZone(requestedTimeZone)
        ? requestedTimeZone
        : fallbackTimeZone

    date = fromZonedTime(localValue, timeZone)
  }

  return Number.isNaN(date.getTime())
    ? null
    : {
        type: 'date-time',
        value: date,
      }
}

function parseDuration(value: string) {
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
      value.toUpperCase(),
    )

  if (!match) {
    return null
  }

  const [
    ,
    days = '0',
    hours = '0',
    minutes = '0',
    seconds = '0',
  ] = match

  return (
    Number(days) * 86_400_000 +
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000
  )
}

function parseReminder(
  property: IcsProperty | undefined,
  fallback: ReminderMinutes,
) {
  if (
    !property ||
    property.parameters.VALUE?.toUpperCase() === 'DATE-TIME'
  ) {
    return fallback
  }

  const match = /^-?PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(
    property.value.toUpperCase(),
  )

  if (!match) {
    return fallback
  }

  const [, hours = '0', minutes = '0'] = match
  const totalMinutes = Number(hours) * 60 + Number(minutes)

  return reminderValues.reduce((closest, candidate) =>
    Math.abs(candidate - totalMinutes) <
    Math.abs(closest - totalMinutes)
      ? candidate
      : closest,
  )
}

function parseHexColor(value: string) {
  const match =
    /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(
      value.trim(),
    )

  if (!match) {
    return null
  }

  return match
    .slice(1)
    .map((channel) => Number.parseInt(channel, 16))
}

function parseEventColor(event: RawIcsEvent) {
  const dayframeColor = getFirstProperty(
    event,
    'X-DAYFRAME-COLOR',
  )?.value

  if (
    dayframeColor &&
    calendarEventColors.includes(
      dayframeColor as CalendarEventColor,
    )
  ) {
    return dayframeColor as CalendarEventColor
  }

  const colorValue = getFirstProperty(event, 'COLOR')?.value
  const rgb = colorValue ? parseHexColor(colorValue) : null

  if (!rgb) {
    return undefined
  }

  return calendarEventColors.reduce<CalendarEventColor>(
    (closestColor, candidateColor) => {
      const closestRgb = parseHexColor(
        calendarEventColorDetails[closestColor].value,
      )!

      const candidateRgb = parseHexColor(
        calendarEventColorDetails[candidateColor].value,
      )!

      const distance = rgb.reduce(
        (total, channel, index) =>
          total + (channel - candidateRgb[index]) ** 2,
        0,
      )

      const closestDistance = rgb.reduce(
        (total, channel, index) =>
          total + (channel - closestRgb[index]) ** 2,
        0,
      )

      return distance < closestDistance
        ? candidateColor
        : closestColor
    },
    'periwinkle',
  )
}

function getStoredTimestamp(
  event: RawIcsEvent,
  propertyName: string,
  fallback: string,
) {
  const property = getFirstProperty(event, propertyName)

  if (!property) {
    return fallback
  }

  const parsed = parseDateTime(property, 'UTC')

  return parsed?.type === 'date-time'
    ? (parsed.value as Date).toISOString()
    : fallback
}

function createEventFromRaw(
  rawEvent: RawIcsEvent,
  calendar: LocalCalendar,
): CalendarEvent | null {
  const startProperty = getFirstProperty(rawEvent, 'DTSTART')

  if (!startProperty) {
    return null
  }

  const start = parseDateTime(
    startProperty,
    calendar.timeZone,
  )

  if (!start) {
    return null
  }

  const endProperty = getFirstProperty(rawEvent, 'DTEND')
  const end = endProperty
    ? parseDateTime(endProperty, calendar.timeZone)
    : null

  const durationValue = getFirstProperty(
    rawEvent,
    'DURATION',
  )?.value

  const duration = durationValue
    ? parseDuration(durationValue)
    : null

  const now = new Date().toISOString()
  const uid = getFirstProperty(rawEvent, 'UID')?.value

  const title =
    unescapeIcsText(
      getFirstProperty(rawEvent, 'SUMMARY')?.value ?? '',
    ).trim() || 'Untitled event'

  const description = unescapeIcsText(
    getFirstProperty(rawEvent, 'DESCRIPTION')?.value ?? '',
  ).trim()

  const location = unescapeIcsText(
    getFirstProperty(rawEvent, 'LOCATION')?.value ?? '',
  ).trim()

  const baseEvent = {
    id: crypto.randomUUID(),
    calendarId: calendar.id,
    externalUid: uid ? unescapeIcsText(uid) : undefined,
    title,
    description: description || undefined,
    location: location || undefined,
    color: parseEventColor(rawEvent),
    reminderMinutes: parseReminder(
      rawEvent.alarmTrigger,
      calendar.defaultReminderMinutes,
    ),
    createdAt: getStoredTimestamp(
      rawEvent,
      'CREATED',
      now,
    ),
    updatedAt: getStoredTimestamp(
      rawEvent,
      'LAST-MODIFIED',
      now,
    ),
  }

  if (start.type === 'date') {
    if (end && end.type !== 'date') {
      return null
    }

    const startDate = start.value as string
    let endDate = end?.value as string | undefined

    if (!endDate && duration !== null) {
      endDate = format(
        addDays(
          parseISO(startDate),
          duration / 86_400_000,
        ),
        'yyyy-MM-dd',
      )
    }

    endDate ??= format(
      addDays(parseISO(startDate), 1),
      'yyyy-MM-dd',
    )

    if (endDate <= startDate) {
      return null
    }

    return {
      ...baseEvent,
      allDay: true,
      startDate,
      endDate,
    }
  }

  if (end && end.type !== 'date-time') {
    return null
  }

  const startsAt = start.value as Date
  const endsAt = end
    ? (end.value as Date)
    : duration !== null
      ? new Date(startsAt.getTime() + duration)
      : addMinutes(
          startsAt,
          calendar.defaultEventDuration,
        )

  if (endsAt <= startsAt) {
    return null
  }

  const exportedTimeZone = unescapeIcsText(
    getFirstProperty(
      rawEvent,
      'X-DAYFRAME-TIMEZONE',
    )?.value ?? '',
  )

  const requestedTimeZone =
    startProperty.parameters.TZID

  const timeZone = isValidTimeZone(exportedTimeZone)
    ? exportedTimeZone
    : requestedTimeZone &&
        isValidTimeZone(requestedTimeZone)
      ? requestedTimeZone
      : calendar.timeZone

  return {
    ...baseEvent,
    allDay: false,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    timeZone,
  }
}

export function parseIcsCalendar(
  content: string,
  calendar: LocalCalendar,
): ParsedIcsCalendar {
  const rawEvents = readRawEvents(content)
  const events: CalendarEvent[] = []
  let skippedInvalid = 0
  let skippedRecurring = 0

  for (const rawEvent of rawEvents) {
    if (
      rawEvent.properties.has('RRULE') ||
      rawEvent.properties.has('RDATE')
    ) {
      skippedRecurring += 1
      continue
    }

    const event = createEventFromRaw(
      rawEvent,
      calendar,
    )

    if (!event) {
      skippedInvalid += 1
      continue
    }

    events.push(event)
  }

  if (rawEvents.length === 0) {
    throw new Error(
      'No events were found in this iCalendar file.',
    )
  }

  return {
    events,
    skippedInvalid,
    skippedRecurring,
  }
}
