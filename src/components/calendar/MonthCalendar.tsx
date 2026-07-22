import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo } from 'react'

import {
  getCalendarEventDateKeys,
  getCalendarEventTimeLabel,
} from '../../lib/calendarEvents'
import { dateLocales } from '../../lib/dateLocales'
import type {
  CalendarDensity,
  CalendarEvent,
  CalendarEventColor,
  LanguagePreference,
  LocalCalendar,
  TimeFormat,
} from '../../types/calendar'

import styles from './MonthCalendar.module.css'

interface MonthCalendarProps {
  calendars: LocalCalendar[]
  density: CalendarDensity
  displayTimeZone: string
  events: CalendarEvent[]
  language: LanguagePreference
  showWeekNumbers: boolean
  timeFormat: TimeFormat
  visibleMonth: Date
  weekStartsOn: 0 | 1
  onCreateEvent: (date: string) => void
  onSelectEvent: (eventId: string) => void
}

interface DisplayEvent {
  event: CalendarEvent
  color: CalendarEventColor
  time?: string
}

const weekdayLabels = {
  en: {
    0: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    1: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  },
  fi: {
    0: [
      'sunnuntai',
      'maanantai',
      'tiistai',
      'keskiviikko',
      'torstai',
      'perjantai',
      'lauantai',
    ],
    1: [
      'maanantai',
      'tiistai',
      'keskiviikko',
      'torstai',
      'perjantai',
      'lauantai',
      'sunnuntai',
    ],
  },
} as const

const eventColorClasses: Record<CalendarEventColor, string> = {
  periwinkle: styles.eventPeriwinkle,
  teal: styles.eventTeal,
  rose: styles.eventRose,
  amber: styles.eventAmber,
}

export function MonthCalendar({
  calendars,
  density,
  displayTimeZone,
  events,
  language,
  showWeekNumbers,
  timeFormat,
  visibleMonth,
  weekStartsOn,
  onCreateEvent,
  onSelectEvent,
}: MonthCalendarProps) {
  const dateLocale = dateLocales[language]

  const weeks = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(visibleMonth), {
      weekStartsOn,
    })

    const lastDay = endOfWeek(endOfMonth(visibleMonth), {
      weekStartsOn,
    })

    const days = eachDayOfInterval({
      start: firstDay,
      end: lastDay,
    })

    return Array.from(
      { length: days.length / 7 },
      (_, weekIndex) =>
        days.slice(weekIndex * 7, weekIndex * 7 + 7),
    )
  }, [visibleMonth, weekStartsOn])

  const eventsByDate = useMemo(() => {
    const groupedEvents = new Map<string, DisplayEvent[]>()

    const calendarsById = new Map(
      calendars.map((calendar) => [
        calendar.id,
        calendar,
      ]),
    )

    for (const event of events) {
      const calendar = calendarsById.get(event.calendarId)

      if (!calendar?.isVisible) {
        continue
      }

      const color = event.color ?? calendar.color

      for (const dateKey of getCalendarEventDateKeys(
        event,
        displayTimeZone,
      )) {
        const dateEvents = groupedEvents.get(dateKey) ?? []

        dateEvents.push({
          event,
          color,
          time: getCalendarEventTimeLabel(
            event,
            dateKey,
            displayTimeZone,
            timeFormat,
          ),
        })

        groupedEvents.set(dateKey, dateEvents)
      }
    }

    for (const dateEvents of groupedEvents.values()) {
      dateEvents.sort((firstEvent, secondEvent) => {
        if (
          firstEvent.event.allDay &&
          !secondEvent.event.allDay
        ) {
          return -1
        }

        if (
          !firstEvent.event.allDay &&
          secondEvent.event.allDay
        ) {
          return 1
        }

        if (
          !firstEvent.event.allDay &&
          !secondEvent.event.allDay
        ) {
          return firstEvent.event.startsAt.localeCompare(
            secondEvent.event.startsAt,
          )
        }

        return firstEvent.event.title.localeCompare(
          secondEvent.event.title,
        )
      })
    }

    return groupedEvents
  }, [calendars, displayTimeZone, events, timeFormat])

  const maximumVisibleEvents =
    density === 'compact' ? 4 : 3

  const calendarClasses = [
    styles.calendar,
    density === 'compact' ? styles.calendarCompact : '',
  ]
    .filter(Boolean)
    .join(' ')

  const columnTemplate = showWeekNumbers
    ? '2.75rem repeat(7, minmax(0, 1fr))'
    : 'repeat(7, minmax(0, 1fr))'

  return (
    <section
      className={calendarClasses}
      aria-label={format(visibleMonth, 'MMMM yyyy', {
        locale: dateLocale,
      })}
    >
      <div
        className={styles.weekdays}
        style={{ gridTemplateColumns: columnTemplate }}
        aria-hidden="true"
      >
        {showWeekNumbers ? (
          <div className={styles.weekNumberHeading}>Wk</div>
        ) : null}

        {weekdayLabels[language][weekStartsOn].map((weekday) => (
          <div
            className={`${styles.weekday} ${
              weekday === 'Saturday' ||
              weekday === 'Sunday' ||
              weekday === 'lauantai' ||
              weekday === 'sunnuntai'
                ? styles.weekdayWeekend
                : ''
            }`}
            key={weekday}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div
        className={styles.monthGrid}
        style={{
          gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {weeks.map((week) => {
          const weekKey = format(week[0], 'yyyy-MM-dd')
          const isoWeekDate =
            weekStartsOn === 0 ? addDays(week[0], 1) : week[0]

          return (
            <div
              className={styles.weekRow}
              style={{ gridTemplateColumns: columnTemplate }}
              key={weekKey}
            >
              {showWeekNumbers ? (
                <div
                  className={styles.weekNumber}
                  aria-label={`Week ${getISOWeek(isoWeekDate)}`}
                >
                  {getISOWeek(isoWeekDate)}
                </div>
              ) : null}

              {week.map((date) => {
                const dateKey = format(date, 'yyyy-MM-dd')
                const dateEvents =
                  eventsByDate.get(dateKey) ?? []

                const visibleEvents = dateEvents.slice(
                  0,
                  maximumVisibleEvents,
                )

                const hiddenEventCount =
                  dateEvents.length - visibleEvents.length

                const dayClasses = [
                  styles.day,
                  !isSameMonth(date, visibleMonth)
                    ? styles.dayOutsideMonth
                    : '',
                  isWeekend(date) ? styles.weekend : '',
                  isToday(date) ? styles.today : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                const createEventLabel = `Add event on ${format(
                  date,
                  'EEEE, MMMM d',
                  { locale: dateLocale },
                )}`

                return (
                  <div className={dayClasses} key={dateKey}>
                    <div className={styles.dayHeader}>
                      <button
                        className={styles.dateButton}
                        type="button"
                        aria-label={createEventLabel}
                        onClick={() => onCreateEvent(dateKey)}
                      >
                        <time
                          className={styles.dateNumber}
                          dateTime={dateKey}
                          aria-current={
                            isToday(date) ? 'date' : undefined
                          }
                        >
                          {format(date, 'd')}
                        </time>
                      </button>

                      <button
                        className={styles.addButton}
                        type="button"
                        aria-label={createEventLabel}
                        title="Add event"
                        onClick={() => onCreateEvent(dateKey)}
                      >
                        <Plus size={13} strokeWidth={2} />
                      </button>
                    </div>

                    <div className={styles.events}>
                      {visibleEvents.map(
                        ({ event, color, time }) => (
                          <button
                            className={`${styles.event} ${
                              eventColorClasses[color]
                            }`}
                            type="button"
                            key={event.id}
                            aria-label={`Edit ${event.title}`}
                            onClick={() =>
                              onSelectEvent(event.id)
                            }
                          >
                            {time ? (
                              <span className={styles.eventTime}>
                                {time}
                              </span>
                            ) : null}

                            <span className={styles.eventTitle}>
                              {event.title}
                            </span>
                          </button>
                        ),
                      )}

                      {hiddenEventCount > 0 ? (
                        <span className={styles.overflow}>
                          +{hiddenEventCount} more
                        </span>
                      ) : null}
                    </div>

                    <button
                      className={styles.emptyArea}
                      type="button"
                      aria-label={createEventLabel}
                      onClick={() => onCreateEvent(dateKey)}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
