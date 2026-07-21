import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
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
import type {
  CalendarEvent,
  CalendarEventColor,
  LocalCalendar,
} from '../../types/calendar'

import styles from './MonthCalendar.module.css'

interface MonthCalendarProps {
  calendars: LocalCalendar[]
  displayTimeZone: string
  events: CalendarEvent[]
  visibleMonth: Date
  onCreateEvent: (date: string) => void
  onSelectEvent: (eventId: string) => void
}

interface DisplayEvent {
  event: CalendarEvent
  color: CalendarEventColor
  time?: string
}

const weekdayLabels = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const maximumVisibleEvents = 3

const eventColorClasses: Record<CalendarEventColor, string> = {
  periwinkle: styles.eventPeriwinkle,
  teal: styles.eventTeal,
  rose: styles.eventRose,
  amber: styles.eventAmber,
}

export function MonthCalendar({
  calendars,
  displayTimeZone,
  events,
  visibleMonth,
  onCreateEvent,
  onSelectEvent,
}: MonthCalendarProps) {
  const days = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(visibleMonth), {
      weekStartsOn: 1,
    })

    const lastDay = endOfWeek(endOfMonth(visibleMonth), {
      weekStartsOn: 1,
    })

    return eachDayOfInterval({
      start: firstDay,
      end: lastDay,
    })
  }, [visibleMonth])

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
  }, [calendars, displayTimeZone, events])

  const weekCount = days.length / 7

  return (
    <section
      className={styles.calendar}
      aria-label={format(visibleMonth, 'MMMM yyyy')}
    >
      <div className={styles.weekdays} aria-hidden="true">
        {weekdayLabels.map((weekday) => (
          <div className={styles.weekday} key={weekday}>
            {weekday}
          </div>
        ))}
      </div>

      <div
        className={styles.monthGrid}
        style={{
          gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))`,
        }}
      >
        {days.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd')
          const dateEvents = eventsByDate.get(dateKey) ?? []

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
                  ))}

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
    </section>
  )
}
