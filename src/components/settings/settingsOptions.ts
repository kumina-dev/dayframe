import type {
  EventDuration,
  ReminderMinutes,
} from '../../types/calendar'

export const commonTimeZones = [
  'UTC',
  'Europe/Helsinki',
  'Europe/Stockholm',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
]

export const durationOptions: Array<{
  value: EventDuration
  label: string
}> = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1 hour 30 minutes' },
]

export const reminderOptions: Array<{
  value: ReminderMinutes
  label: string
}> = [
  { value: 0, label: 'At event time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
]
