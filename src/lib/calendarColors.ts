import type { CalendarEventColor } from '../types/calendar'

export const calendarEventColors: CalendarEventColor[] = [
  'periwinkle',
  'teal',
  'rose',
  'amber',
]

export const calendarEventColorDetails: Record<
  CalendarEventColor,
  {
    label: string
    value: string
  }
> = {
  periwinkle: {
    label: 'Periwinkle',
    value: '#8e9cf4',
  },
  teal: {
    label: 'Teal',
    value: '#56beb0',
  },
  rose: {
    label: 'Rose',
    value: '#d77091',
  },
  amber: {
    label: 'Amber',
    value: '#daa752',
  },
}
